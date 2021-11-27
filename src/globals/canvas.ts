import 'webgl-memory';
import { GLCat } from '@fms-cat/glcat-ts';
import { RESOLUTION } from '../config';

export const canvas = document.createElement( 'canvas' );
canvas.width = RESOLUTION[ 0 ];
canvas.height = RESOLUTION[ 1 ];

export const gl = canvas.getContext( 'webgl2', { antialias: false } )!;
gl.lineWidth( 1 );

export const glCat = new GLCat( gl );
