#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uv;

out vec4 vPosition;
out vec3 vNormal;
out vec2 vUv;

uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

// ------

void main() {
  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  vUv = uv;

  vPosition = modelMatrix * vec4( position, 1.0 );
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;

  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;
}
