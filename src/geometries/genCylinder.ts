import { GLCatBuffer } from '@fms-cat/glcat-ts';
import { TAU } from '../utils/constants';
import { gl, glCat } from '../globals/canvas';

interface ResultGenCylinder {
  position: GLCatBuffer;
  normal: GLCatBuffer;
  uv: GLCatBuffer;
  index: GLCatBuffer;
  count: number;
  mode: GLenum;
  indexType: GLenum;
}

export function genCylinder( options?: {
  radialSegs?: number,
  heightSegs?: number,
} ): ResultGenCylinder {
  const radialSegs = options?.radialSegs ?? 16;
  const heightSegs = options?.heightSegs ?? 1;

  const pos: number[] = [];
  const nor: number[] = [];
  const auv: number[] = [];
  const ind: number[] = [];

  for ( let ih = 0; ih < heightSegs + 1; ih ++ ) {
    const v = ih / heightSegs;
    const z = v * 2.0 - 1.0;
    for ( let ir = 0; ir < radialSegs; ir ++ ) {
      const i = ih * radialSegs + ir;
      const i1 = i + 1;

      const t = TAU * ir / radialSegs;
      const x = Math.cos( t );
      const y = Math.sin( t );

      pos.push( x, y, z );
      nor.push( x, y, 0.0 );
      auv.push( ir / radialSegs, v );

      if ( ih !== heightSegs ) {
        ind.push(
          i, i + radialSegs + 1, i1 + radialSegs + 1,
          i, i1 + radialSegs + 1, i1,
        );
      }
    }

    pos.push( 1, 0.0, z );
    nor.push( 1.0, 0.0, 0.0 );
    auv.push( 1.0, v );
  }

  const position = glCat.createBuffer();
  position.setVertexbuffer( new Float32Array( pos ) );

  const normal = glCat.createBuffer();
  normal.setVertexbuffer( new Float32Array( nor ) );

  const uv = glCat.createBuffer();
  uv.setVertexbuffer( new Float32Array( auv ) );

  const index = glCat.createBuffer();
  index.setIndexbuffer( new Uint16Array( ind ) );

  return {
    position,
    normal,
    uv,
    index,
    count: ind.length,
    mode: gl.TRIANGLES,
    indexType: gl.UNSIGNED_SHORT,
  };
}
