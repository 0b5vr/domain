// import 'webgl-memory';
import { GLCat } from '@fms-cat/glcat-ts';

export const canvas = document.createElement( 'canvas' );

export const gl = canvas.getContext( 'webgl2', { antialias: false } )!;
gl.lineWidth( 1 );

export const glCat = new GLCat( gl );
