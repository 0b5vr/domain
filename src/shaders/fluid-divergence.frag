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

  vec3 v = sample3DNearest( samplerVelocity, pos ).xyz;
  float nx = sample3DNearest( samplerVelocity, pos - d.yxx ).x;
  float px = sample3DNearest( samplerVelocity, pos + d.yxx ).x;
  float ny = sample3DNearest( samplerVelocity, pos - d.xyx ).y;
  float py = sample3DNearest( samplerVelocity, pos + d.xyx ).y;
  float nz = sample3DNearest( samplerVelocity, pos - d.xxy ).z;
  float pz = sample3DNearest( samplerVelocity, pos + d.xxy ).z;

  if ( pos.x < -0.5 + 1.0 / fGridReso ) { nx = -v.x; }
  if ( pos.x > 0.5 - 1.0 / fGridReso ) { px = -v.x; }
  if ( pos.y < -0.5 + 1.0 / fGridReso ) { ny = -v.y; }
  if ( pos.y > 0.5 - 1.0 / fGridReso ) { py = -v.y; }
  if ( pos.z < -0.5 + 1.0 / fGridReso ) { nz = -v.z; }
  if ( pos.z > 0.5 - 1.0 / fGridReso ) { pz = -v.z; }

  float divergence = ( px - nx + py - ny + pz - nz ) / 3.0;
  fragColor = vec4( divergence, 0.0, 0.0, 1.0 );
}
