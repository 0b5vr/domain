#version 300 es

#define saturate(i) (clamp(i,0.,1.))
#define clampToGrid(i) (clamp(i,-0.5+0.5/fGridReso,0.5-0.5/fGridReso))
#define lofi(i,j) floor((i)/(j))*(j)

precision highp float;

const float fGridReso = float( GRID_RESO );
const float fGridResoSqrt = float( GRID_RESO_SQRT );

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform float deltaTime;
uniform float dissipation;
uniform sampler2D samplerVelocity;
uniform sampler2D samplerSource;

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

void main() {
  vec3 pos = clampToGrid( vec3(
    fract( vUv * fGridResoSqrt ),
    ( dot( floor( vUv * fGridResoSqrt ), vec2( 1.0, fGridResoSqrt ) ) + 0.5 ) / fGridReso
  ) - 0.5 );

  vec3 vel = sample3DNearest( samplerVelocity, pos ).xyz;
  vec4 result = sample3DLinear( samplerSource, clampToGrid( pos - deltaTime * vel ) );

  float decay = 1.0 + deltaTime * dissipation;
  fragColor = result / decay;
}
