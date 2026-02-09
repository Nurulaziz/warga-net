import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                WHATSAPP_GATEWAY_URL: 'https://api.whatsapp.example.com',
                WHATSAPP_API_KEY: 'test-api-key',
                WHATSAPP_PHONE_NUMBER_ID: 'test-phone-id',
                WHATSAPP_MAX_RETRIES: 3,
                WHATSAPP_RETRY_DELAY_MS: 100, // Shorter delay for tests
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('harus terdefinisi', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('harus send OTP dengan template message standar', async () => {
      const phoneNumber = '+6281234567890';
      const otp = '123456';

      const result = await service.sendOtp(phoneNumber, otp);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('harus include OTP dalam message', async () => {
      const phoneNumber = '+6281234567890';
      const otp = '123456';

      // Spy on private method indirectly through public method
      const sendSpy = jest.spyOn(service as any, 'sendMessage');

      await service.sendOtp(phoneNumber, otp);

      expect(sendSpy).toHaveBeenCalled();
      const message = sendSpy.mock.calls[0][1];
      expect(message).toContain(otp);
      expect(message).toContain('WargaNet');
      expect(message).toContain('5 menit');
    });
  });

  describe('sendNotification', () => {
    it('harus send notification message', async () => {
      const phoneNumber = '+6281234567890';
      const message = 'Test notification';

      const result = await service.sendNotification(phoneNumber, message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('checkHealth', () => {
    it('harus return true jika gateway configured', async () => {
      const result = await service.checkHealth();

      expect(result).toBe(true);
    });

    it('harus return false jika gateway tidak configured', async () => {
      // Create service with empty config
      const emptyConfigService = {
        get: jest.fn(() => ''),
      };

      const module = await Test.createTestingModule({
        providers: [
          WhatsAppService,
          {
            provide: ConfigService,
            useValue: emptyConfigService,
          },
        ],
      }).compile();

      const unconfiguredService = module.get<WhatsAppService>(WhatsAppService);
      const result = await unconfiguredService.checkHealth();

      expect(result).toBe(false);
    });
  });

  describe('retry logic', () => {
    it('harus retry hingga maxRetries jika gagal', async () => {
      const phoneNumber = '+6281234567890';
      const message = 'Test message';

      // Mock sendMessage to always fail
      const sendSpy = jest
        .spyOn(service as any, 'sendMessage')
        .mockResolvedValue({ success: false, error: 'Network error' });

      const result = await service.sendOtp(phoneNumber, '123456');

      expect(result.success).toBe(false);
      expect(sendSpy).toHaveBeenCalledTimes(3); // maxRetries = 3
    });

    it('harus return success jika retry berhasil', async () => {
      const phoneNumber = '+6281234567890';

      // Mock sendMessage to fail twice then succeed
      const sendSpy = jest
        .spyOn(service as any, 'sendMessage')
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg_123' });

      const result = await service.sendOtp(phoneNumber, '123456');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_123');
      expect(sendSpy).toHaveBeenCalledTimes(3);
    });

    it('harus apply exponential backoff', async () => {
      const phoneNumber = '+6281234567890';

      // Mock sendMessage to always fail
      jest
        .spyOn(service as any, 'sendMessage')
        .mockResolvedValue({ success: false, error: 'Network error' });

      // Mock sleep to track delays
      const sleepSpy = jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      await service.sendOtp(phoneNumber, '123456');

      // Should sleep twice (after attempt 1 and 2, not after attempt 3)
      expect(sleepSpy).toHaveBeenCalledTimes(2);

      // Check exponential backoff delays
      // attempt 1: 100ms * 2^0 = 100ms
      // attempt 2: 100ms * 2^1 = 200ms
      expect(sleepSpy).toHaveBeenNthCalledWith(1, 100);
      expect(sleepSpy).toHaveBeenNthCalledWith(2, 200);
    });
  });

  describe('error handling', () => {
    it('harus handle ServiceUnavailableException', async () => {
      const phoneNumber = '+6281234567890';

      // Mock sendMessage to throw ServiceUnavailableException
      jest
        .spyOn(service as any, 'sendMessage')
        .mockRejectedValue(new ServiceUnavailableException('Gateway unavailable'));

      const result = await service.sendOtp(phoneNumber, '123456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Gateway unavailable');
    });

    it('harus handle generic errors', async () => {
      const phoneNumber = '+6281234567890';

      // Mock sendMessage to throw generic error
      jest.spyOn(service as any, 'sendMessage').mockRejectedValue(new Error('Network timeout'));

      const result = await service.sendOtp(phoneNumber, '123456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });
  });

  describe('message template', () => {
    it('harus format OTP message dengan benar', async () => {
      const phoneNumber = '+6281234567890';
      const otp = '123456';

      const sendSpy = jest.spyOn(service as any, 'sendMessage');

      await service.sendOtp(phoneNumber, otp);

      const message = sendSpy.mock.calls[0][1];

      expect(message).toContain('Kode OTP WargaNet Anda:');
      expect(message).toContain(otp);
      expect(message).toContain('Berlaku 5 menit');
      expect(message).toContain('Jangan bagikan kode ini');
    });
  });
});
