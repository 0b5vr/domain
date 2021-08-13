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
uniform sampler2D samplerVelocity;

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

  vec4 nx = sample3DNearest( samplerVelocity, clampToGrid( pos - d.yxx ) );
  vec4 px = sample3DNearest( samplerVelocity, clampToGrid( pos + d.yxx ) );
  vec4 ny = sample3DNearest( samplerVelocity, clampToGrid( pos - d.xyx ) );
  vec4 py = sample3DNearest( samplerVelocity, clampToGrid( pos + d.xyx ) );
  vec4 nz = sample3DNearest( samplerVelocity, clampToGrid( pos - d.xxy ) );
  vec4 pz = sample3DNearest( samplerVelocity, clampToGrid( pos + d.xxy ) );

  fragColor = vec4(
    nz.y + py.z - pz.y - ny.z,
    nx.z + pz.x - px.z - nz.x,
    ny.x + px.y - py.x - nx.y,
    1.0
  );
}
