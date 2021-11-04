#version 300 es

precision highp float;

const float SAMPLES = 16.0;
const float INV_SAMPLES = 1.0 / SAMPLES;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;

uniform float _deltaSample;
uniform vec4 timeLength;
uniform vec4 _timeHead;

in float off;

out float outL;
out float outR;

vec2 mainAudio( vec4 time ) {
  vec2 dest = vec2( 0.0 );

  dest += 0.1 * sin( time.y * 440.0 * TAU ) * exp( -5.0 * time.y );

  return dest;
}

void main() {
  vec2 out2 = mainAudio( mod( _timeHead + off * _deltaSample, timeLength ) );
  outL = out2.x;
  outR = out2.y;
}
