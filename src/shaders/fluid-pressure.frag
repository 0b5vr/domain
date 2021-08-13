#version 300 es

#define saturate(i) (clamp(i,0.,1.))
#define clampToGrid(i) (clamp(i,-0.5+0.5/fGridReso,0.5-0.5/fGridReso))
#define lofi(i,j) floor((i)/(j))*(j)

precision highp float;

const float fGridReso = float( GRID_RESO );
const float fGridResoSqrt = float( GRID_RESO_SQRT );
const vec2 d = vec2( 0.0, 1.0 / fGridReso );

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform float deltaTime;
uniform sampler2D samplerPressure;
uniform sampler2D samplerDivergence;

vec4 sample3DNearest( sampler2D sampleri, vec3 pos ) {
  vec2 uv = clamp( pos.xy + 0.5, 0.0, 1.0 ) / fGridResoSqrt;
  float z = saturate( pos.z + 0.5 );
  uv.x += mod( floor( z * fGridReso ), fGridResoSqrt ) / fGridResoSqrt;
  uv.y += floor( z * fGridResoSqrt ) / fGridResoSqrt;

  return texture( sampleri, uv );
}

void main() {
  vec3 pos = clampToGrid( vec3(
    fract( vUv * fGridResoSqrt ),
    ( dot( floor( vUv * fGridResoSqrt ), vec2( 1.0, fGridResoSqrt ) ) + 0.5 ) / fGridReso
  ) - 0.5 );

  float divergence = sample3DNearest( samplerDivergence, pos ).x;

  float pressure = (
    sample3DNearest( samplerPressure, clampToGrid( pos + d.yxx ) ).x
    + sample3DNearest( samplerPressure, clampToGrid( pos - d.yxx ) ).x
    + sample3DNearest( samplerPressure, clampToGrid( pos + d.xyx ) ).x
    + sample3DNearest( samplerPressure, clampToGrid( pos - d.xyx ) ).x
    + sample3DNearest( samplerPressure, clampToGrid( pos + d.xxy ) ).x
    + sample3DNearest( samplerPressure, clampToGrid( pos - d.xxy ) ).x
    - divergence
  ) / 6.0;

  pressure += 50.0 * exp( -20.0 * fract( time ) ) * smoothstep( 0.05, 0.0, length( pos + 0.4 * sin( time * vec3( 3, 4, 5 ) ) ) );

  fragColor = vec4( pressure, 0.0, 0.0, 1.0 );
}
