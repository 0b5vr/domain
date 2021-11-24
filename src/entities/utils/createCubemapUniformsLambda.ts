import { Component } from '../../heck/components/Component';
import { CubemapNode, CubemapNodeTag } from '../CubemapNode';
import { IBLLUTCalc, IBLLUTCalcTag } from '../IBLLUTCalc';
import { Lambda } from '../../heck/components/Lambda';
import { MapOfSet } from '../../utils/MapOfSet';
import { Material } from '../../heck/Material';

export function createCubemapUniformsLambda( materials: Material[] ): Lambda {
  const lambda = ( { componentsByTag }: {
    componentsByTag: MapOfSet<symbol, Component>,
  } ): void => {
    const cubemapNode = Array.from(
      componentsByTag.get( CubemapNodeTag )
    )[ 0 ] as CubemapNode | undefined;
    const ibllutCalc = Array.from(
      componentsByTag.get( IBLLUTCalcTag )
    )[ 0 ] as IBLLUTCalc | undefined;

    materials.map( ( material ) => {
      if ( ibllutCalc ) {
        material.addUniformTextures( 'samplerIBLLUT', ibllutCalc.texture );
      }

      if ( cubemapNode ) {
        material.addUniformTextures(
          'samplerEnvDry',
          cubemapNode.targetCompiled.texture
        );
        material.addUniformTextures(
          'samplerEnvWet',
          cubemapNode.targetMerged.texture
        );
      }
    } );
  };

  return new Lambda( {
    onUpdate: lambda,
    onDraw: lambda,
  } );
}
