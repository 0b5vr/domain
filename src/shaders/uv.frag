#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

void main() {
  fragColor = vec4( vUv, 0.0, 1.0 );
}
