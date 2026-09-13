import { IsHexColor, IsIn, IsOptional } from 'class-validator';

export class UpdateAppearancePreferencesDto {
  @IsIn(['light', 'dark', 'system'])
  mode!: 'light' | 'dark' | 'system';

  @IsIn(['blue', 'green', 'orange', 'custom'])
  accent!: 'blue' | 'green' | 'orange' | 'custom';

  @IsOptional()
  @IsHexColor()
  customAccent?: string;

  @IsIn(['geist', 'archivo', 'mono'])
  font!: 'geist' | 'archivo' | 'mono';

  @IsIn(['small', 'standard', 'large'])
  textSize!: 'small' | 'standard' | 'large';

  @IsIn(['square', 'subtle', 'rounded'])
  radius!: 'square' | 'subtle' | 'rounded';

  @IsIn(['compact', 'comfortable'])
  density!: 'compact' | 'comfortable';
}
