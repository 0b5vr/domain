import { GLCatBuffer } from '@fms-cat/glcat-ts';
import { Geometry } from '../heck/Geometry';
import { TAU } from '../utils/constants';
import { gl, glCat } from '../globals/canvas';

interface ResultGenCylinder {
  position: GLCatBuffer;
  normal: GLCatBuffer;
  uv: GLCatBuffer;
  index: GLCatBuffer;
  geometry: Geometry;
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

  const arrayPosition: number[] = [];
  const arrayNormal: number[] = [];
  const arrayUv: number[] = [];
  const arrayIndex: number[] = [];

  for ( let ih = 0; ih < heightSegs + 1; ih ++ ) {
    const v = ih / heightSegs;
    const z = v * 2.0 - 1.0;
    for ( let ir = 0; ir < radialSegs; ir ++ ) {
      const i = ih * radialSegs + ir;
      const i1 = i + 1;

      const t = TAU * ir / radialSegs;
      const x = Math.cos( t );
      const y = Math.sin( t );

      arrayPosition.push( x, y, z );
      arrayNormal.push( x, y, 0.0 );
      arrayUv.push( ir / radialSegs, v );

      if ( ih !== heightSegs ) {
        arrayIndex.push(
          i, i + radialSegs + 1, i1 + radialSegs + 1,
          i, i1 + radialSegs + 1, i1,
        );
      }
    }

    arrayPosition.push( 1, 0.0, z );
    arrayNormal.push( 1.0, 0.0, 0.0 );
    arrayUv.push( 1.0, v );
  }

  // -- buffers ------------------------------------------------------------------------------------
  const position = glCat.createBuffer();
  position.setVertexbuffer( new Float32Array( arrayPosition ) );

  const normal = glCat.createBuffer();
  normal.setVertexbuffer( new Float32Array( arrayNormal ) );

  const uv = glCat.createBuffer();
  uv.setVertexbuffer( new Float32Array( arrayUv ) );

  const index = glCat.createBuffer();
  index.setIndexbuffer( new Uint16Array( arrayIndex ) );

  // -- geometry -----------------------------------------------------------------------------------
  const geometry = new Geometry();

  geometry.vao.bindVertexbuffer( position, 0, 3 );
  geometry.vao.bindVertexbuffer( normal, 1, 3 );
  geometry.vao.bindVertexbuffer( uv, 2, 2 );
  geometry.vao.bindIndexbuffer( index );

  const count = geometry.count = arrayIndex.length;
  const mode = geometry.mode = gl.TRIANGLES;
  const indexType = geometry.indexType = gl.UNSIGNED_SHORT;

  return {
    position,
    normal,
    uv,
    index,
    geometry,
    count,
    mode,
    indexType,
  };
}
