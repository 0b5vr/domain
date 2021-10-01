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
uniform float curl;
uniform sampler2D samplerCurl;
uniform sampler2D samplerPressure;
uniform sampler2D samplerVelocity;

vec2 safeNormalize( vec2 v ) {
  return v / ( length( v ) + 1E-4 );
}

vec4 sample3DNearest( sampler2D sampleri, vec3 pos ) {
  vec2 uv = clamp( pos.xy + 0.5, 0.0, 1.0 ) / fGridResoSqrt;
  float z = saturate( pos.z + 0.5 );
  uv.x += mod( floor( z * fGridReso ), fGridResoSqrt ) / fGridResoSqrt;
  uv.y += floor( z * fGridResoSqrt ) / fGridResoSqrt;

  return texture( sampleri, uv );
}

vec3 resolveVorticity( vec3 pos ) {
  vec4 center = sample3DNearest( samplerCurl, pos );
  vec4 nx = sample3DNearest( samplerCurl, clampToGrid( pos - d.yxx ) );
  vec4 px = sample3DNearest( samplerCurl, clampToGrid( pos + d.yxx ) );
  vec4 ny = sample3DNearest( samplerCurl, clampToGrid( pos - d.xyx ) );
  vec4 py = sample3DNearest( samplerCurl, clampToGrid( pos + d.xyx ) );
  vec4 nz = sample3DNearest( samplerCurl, clampToGrid( pos - d.xxy ) );
  vec4 pz = sample3DNearest( samplerCurl, clampToGrid( pos + d.xxy ) );

  vec3 force = vec3( 0.0 );
  force.xy += safeNormalize( 0.25 * vec2( py.z - ny.z, nx.z - px.z ) );
  force.yz += safeNormalize( 0.25 * vec2( pz.x - nz.x, ny.x - py.x ) );
  force.zx += safeNormalize( 0.25 * vec2( px.y - nx.y, nz.y - pz.y ) );
  force *= curl * center.xyz;

  return deltaTime * force;
}

vec3 resolvePressure( vec3 pos ) {
  vec3 n = vec3(
    sample3DNearest( samplerPressure, clampToGrid( pos - d.yxx ) ).x,
    sample3DNearest( samplerPressure, clampToGrid( pos - d.xyx ) ).x,
    sample3DNearest( samplerPressure, clampToGrid( pos - d.xxy ) ).x
  );
  vec3 p = vec3(
    sample3DNearest( samplerPressure, clampToGrid( pos + d.yxx ) ).x,
    sample3DNearest( samplerPressure, clampToGrid( pos + d.xyx ) ).x,
    sample3DNearest( samplerPressure, clampToGrid( pos + d.xxy ) ).x
  );

  return n - p;
}

void main() {
  vec3 pos = clampToGrid( vec3(
    fract( vUv * fGridResoSqrt ),
    ( dot( floor( vUv * fGridResoSqrt ), vec2( 1.0, fGridResoSqrt ) ) + 0.5 ) / fGridReso
  ) - 0.5 );

  vec3 v = sample3DNearest( samplerVelocity, pos ).xyz;

  v += resolveVorticity( pos );
  v += resolvePressure( pos );

  fragColor = vec4( v, 1.0 );
}
