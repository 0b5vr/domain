import { sub, vec3 } from '../shader-builder/shaderBuilder';

export const PI = Math.acos( -1.0 );
export const INV_PI = 1.0 / PI;
export const HALF_PI = PI / 2.0;
export const TAU = 2.0 * PI;
export const HALF_SQRT_TWO = Math.sqrt( 2.0 ) / 2.0;
export const DIELECTRIC_SPECULAR = vec3( 0.04 );
export const ONE_SUB_DIELECTRIC_SPECULAR = sub( 1.0, DIELECTRIC_SPECULAR );
