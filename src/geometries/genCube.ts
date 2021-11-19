import { GLCatBuffer } from '@fms-cat/glcat-ts';
import { HALF_PI, PI } from '../utils/constants';
import { gl, glCat } from '../globals/canvas';

interface ResultGenCube {
  position: GLCatBuffer;
  normal: GLCatBuffer;
  uv: GLCatBuffer;
  index: GLCatBuffer;
  count: number;
  mode: GLenum;
  indexType: GLenum;
}

export function genCube( options?: {
  dimension?: [ number, number, number ]
} ): ResultGenCube {
  const dimension = options?.dimension ?? [ 1, 1, 1 ];

  const arrayPosition: number[] = [];
  const arrayNormal: number[] = [];
  const arrayUv: number[] = [];
  const arrayIndex: number[] = [];

  const chunkPosition = [
    [ -1, -1,  1 ],
    [  1, -1,  1 ],
    [ -1,  1,  1 ],
    [  1,  1,  1 ],
  ];
  const chunkNormal = [
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
  ];
  const chunkUv = [
    [ 0, 0 ],
    [ 1, 0 ],
    [ 0, 1 ],
    [ 1, 1 ],
  ];

  for ( let i = 0; i < 6; i ++ ) {
    const rotate = ( v: number[] ): number[] => {
      const vt: number[] = [];

      if ( i < 4 ) {
        const t = i * HALF_PI;
        vt[ 0 ] = Math.cos( t ) * v[ 0 ] - Math.sin( t ) * v[ 2 ];
        vt[ 1 ] = v[ 1 ];
        vt[ 2 ] = Math.sin( t ) * v[ 0 ] + Math.cos( t ) * v[ 2 ];
      } else {
        const t = ( i - 0.5 ) * PI;
        vt[ 0 ] = v[ 0 ];
        vt[ 1 ] = Math.cos( t ) * v[ 1 ] - Math.sin( t ) * v[ 2 ];
        vt[ 2 ] = Math.sin( t ) * v[ 1 ] + Math.cos( t ) * v[ 2 ];
      }

      return vt;
    };

    const scale = ( v: number[] ): number[] => {
      return [
        v[ 0 ] * dimension[ 0 ],
        v[ 1 ] * dimension[ 1 ],
        v[ 2 ] * dimension[ 2 ],
      ];
    };

    arrayPosition.push( ...chunkPosition.map( rotate ).map( scale ).flat() );
    arrayNormal.push( ...chunkNormal.map( rotate ).flat() );
    arrayUv.push( ...chunkUv.flat() );
    arrayIndex.push( ...[ 0, 1, 3, 0, 3, 2 ].map( ( v ) => v + 4 * i ) );
  }

  const position = glCat.createBuffer();
  position.setVertexbuffer( new Float32Array( arrayPosition ) );

  const normal = glCat.createBuffer();
  normal.setVertexbuffer( new Float32Array( arrayNormal ) );

  const uv = glCat.createBuffer();
  uv.setVertexbuffer( new Float32Array( arrayUv ) );

  const index = glCat.createBuffer();
  index.setIndexbuffer( new Uint16Array( arrayIndex ) );

  return {
    position,
    normal,
    uv,
    index,
    count: arrayIndex.length,
    mode: gl.TRIANGLES,
    indexType: gl.UNSIGNED_SHORT,
  };
}
