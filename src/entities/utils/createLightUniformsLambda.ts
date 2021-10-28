import { Component } from '../../heck/components/Component';
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
      material.addUniform(
        'lightCount',
        '1i',
        activeLights.length,
      );

      material.addUniformVector(
        'lightNearFar',
        '2fv',
        activeLights.map( ( light ) => [ light.camera.near, light.camera.far ] ).flat(),
      );

      material.addUniformVector(
        'lightPos',
        '3fv',
        activeLights.map( ( light ) => light.globalTransformCache.position ).flat(),
      );

      material.addUniformVector(
        'lightColor',
        '3fv',
        activeLights.map( ( light ) => light.color ).flat(),
      );

      material.addUniformVector(
        'lightParams',
        '4fv',
        activeLights.map( ( light ) => [ light.spotness, 0.0, 0.0, 0.0 ] ).flat(),
      );

      material.addUniformMatrixVector(
        'lightPV',
        'Matrix4fv',
        activeLights.map( ( light ) => (
          mat4Multiply(
            light.camera.projectionMatrix,
            mat4Inverse( light.globalTransformCache.matrix ),
          )
        ) ).flat(),
      );

      material.addUniformTextures(
        'samplerShadow',
        ...activeLights.map( ( light ) => light.shadowMap.texture ),
      );
    } );
  };

  return new Lambda( {
    onDraw: lambda,
    onUpdate: lambda,
  } );
}
