#version 300 es

precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define clampToGrid(i) (clamp(i,-0.5+0.5/fGridReso,0.5-0.5/fGridReso))
#define lofi(i,j) floor((i)/(j))*(j)
#define fs(i) (fract(sin((i)*114.514)*1919.810))

const int MARCH_ITER = 50;
const int SHADOW_ITER = 10;
const float INV_MARCH_ITER = 1.0 / float( MARCH_ITER );
const float INV_SHADOW_ITER = 1.0 / float( SHADOW_ITER );
const float MARCH_STEP_LENGTH = 0.2;
const float SHADOW_STEP_LENGTH = 0.04;
const float fGridReso = float( GRID_RESO );
const float fGridResoSqrt = float( GRID_RESO_SQRT );
const float PI = 3.14159265;
const float TAU = PI * 2.0;
const vec2 d = vec2( 0.0, 1.0 / fGridReso );
const vec3 LIGHT_DIR = normalize( vec3( 0.0, 1.0, 0.0 ) );

float seed;

in vec4 vPositionWithoutModel;

out vec4 fragColor;

uniform float time;
uniform vec2 resolution;
uniform vec2 cameraNearFar;
uniform mat4 inversePVM;
uniform sampler2D samplerRandom;
uniform sampler2D samplerDensity;

float random() {
  return fs( seed ++ );
}

vec4 sample3DNearest( sampler2D sampleri, vec3 pos ) {
  vec2 uv = clamp( pos.xy + 0.5, 0.0, 1.0 ) / fGridResoSqrt;
  float z = pos.z + 0.5;
  uv.x += mod( floor( z * fGridReso ), fGridResoSqrt ) / fGridResoSqrt;
  uv.y += floor( z * fGridResoSqrt ) / fGridResoSqrt;

  return texture( sampleri, uv );
}

vec4 sample3DLinear( sampler2D sampleri, vec3 pos ) {
  float t = fract( ( pos.z - 0.5 / fGridReso + 0.5 ) * fGridReso );
  vec3 a = pos;
  a.z -= t / fGridReso;
  vec3 b = a;
  b.z += 1.0 / fGridReso;

  return mix(
    sample3DNearest( sampleri, a ),
    sample3DNearest( sampleri, b ),
    t
  );
}

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

vec4 getDensity( vec3 p ) {
  if ( any( greaterThan( abs( p ), vec3( 0.5 - 0.5 / fGridReso ) ) ) ) {
    return vec4( 0.0 );
  }

  return sample3DLinear( samplerDensity, p );
}

vec4 march( vec3 ro, vec3 rd ) {
  float rl = length( vPositionWithoutModel.xyz - ro ) + MARCH_STEP_LENGTH * random();
  vec3 rp = ro + rd * rl;

  vec4 accum = vec4( 0.0, 0.0, 0.0, 1.0 );

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    if ( accum.a < 0.1 ) {
      break;
    }

    float d = clamp( 6.0 * getDensity( rp ).x * INV_MARCH_ITER, 0.0, 1.0 );

    if ( d > 1E-3 ) {
      float lrl = SHADOW_STEP_LENGTH * ( 0.5 + 0.5 * random() );
      vec3 lrp = rp + LIGHT_DIR * lrl;
      float shadow = 0.0;

      for ( int s = 0; s < SHADOW_ITER; s ++ ) {
        float lsample = getDensity( lrp ).x;
        shadow += lsample;

        lrl += SHADOW_STEP_LENGTH * ( 0.5 + 0.5 * random() );
        lrp = rp + LIGHT_DIR * lrl;
      }

      float s = exp( -1.0 * shadow * INV_SHADOW_ITER );
      vec3 col = mix( vec3( 1.1, 0.1, 0.25 ), vec3( 0.1, 0.8, 4.0 ), d );
      accum.rgb += s * d * col * accum.a;
      accum.a *= 1.0 - d;
    }

    rl += MARCH_STEP_LENGTH * ( 0.5 + 0.5 * random() );
    rp = ro + rd * rl;

    if ( rl > cameraNearFar.y ) { break; }
  }

  return accum;
}

void main() {
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;
  seed = texture( samplerRandom, p ).x;

  vec3 ro = divideByW( inversePVM * vec4( p, 0.0, 1.0 ) );
  vec3 farPos = divideByW( inversePVM * vec4( p, 1.0, 1.0 ) );
  vec3 rd = normalize( farPos - ro );

  vec4 accum = march( ro, rd );

  fragColor = vec4( accum.rgb, 1.0 );
}
