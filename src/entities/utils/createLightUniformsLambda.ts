import { Component } from '../../heck/components/Component';
import { GLCatTexture } from '@0b5vr/glcat-ts';
import { Lambda } from '../../heck/components/Lambda';
import { MapOfSet } from '../../utils/MapOfSet';
import { Material } from '../../heck/Material';
import { PointLightNode, PointLightTag } from '../PointLightNode';
import { mat4Inverse, mat4Multiply } from '@0b5vr/experimental';

export function createLightUniformsLambda( materials: Material[] ): Lambda {
  const lambda = ( { frameCount, componentsByTag }: {
    frameCount: number,
    componentsByTag: MapOfSet<symbol, Component>,
  } ): void => {
    const activeLights = Array.from( componentsByTag.get( PointLightTag ) )
      .filter( ( light ) => (
        frameCount === light.lastUpdateFrame
      ) ) as PointLightNode[];

    materials.map( ( material ) => {
      const lightNearFar: number[] = [];
      const lightPos: number[] = [];
      const lightColor: number[] = [];
      const lightParams: number[] = [];
      const lightPV: number[] = [];
      const samplerShadow: GLCatTexture[] = [];

      activeLights.map( ( light ) => {
        const { camera, color, spotness, spotSharpness } = light;
        const position = light.globalTransformCache.position;
        const pv = mat4Multiply(
          camera.projectionMatrix,
          mat4Inverse( light.globalTransformCache.matrix ),
        );

        // protip: spread operator is slow :wibbry:
        lightNearFar.push( camera.near, camera.far );
        lightPos.push( position[ 0 ], position[ 1 ], position[ 2 ] );
        lightColor.push( color[ 0 ], color[ 1 ], color[ 2 ] );
        lightParams.push( spotness, spotSharpness, 0.0, 0.0 );
        lightPV.push(
          pv[ 0 ], pv[ 1 ], pv[ 2 ], pv[ 3 ],
          pv[ 4 ], pv[ 5 ], pv[ 6 ], pv[ 7 ],
          pv[ 8 ], pv[ 9 ], pv[ 10 ], pv[ 11 ],
          pv[ 12 ], pv[ 13 ], pv[ 14 ], pv[ 15 ],
        );
        samplerShadow.push( light.shadowMap.texture );
      } );

      material.addUniform( 'lightCount', '1i', activeLights.length );
      material.addUniformVector( 'lightNearFar', '2fv', lightNearFar );
      material.addUniformVector( 'lightPos', '3fv', lightPos );
      material.addUniformVector( 'lightColor', '3fv', lightColor );
      material.addUniformVector( 'lightParams', '4fv', lightParams );
      material.addUniformMatrixVector( 'lightPV', 'Matrix4fv', lightPV );
      material.addUniformTextures( 'samplerShadow', ...samplerShadow );
    } );
  };

  return new Lambda( {
    onDraw: lambda,
    onUpdate: lambda,
  } );
}
