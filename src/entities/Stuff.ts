import { Asphalt } from './Asphalt';
import { BoundingBox } from './BoundingBox';
import { Fluid } from './Fluid';
import { Lambda } from '../heck/components/Lambda';
import { MengerSponge } from './MengerSponge';
import { RawVector3, quatFromAxisAngle, vecNormalize } from '@0b5vr/experimental';
import { SSSBox } from './SSSBox';
import { SceneNode } from '../heck/components/SceneNode';
import { Sp4ghet } from './Sp4ghet';
import { auto } from '../globals/automaton';

export class Stuff extends SceneNode {
  public constructor() {
    super();

    this.transform.position = [ 0.0, 3.0, 0.0 ];
    this.transform.scale = [ 3.0, 3.0, 3.0 ];

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      new SSSBox(),
      new MengerSponge(),
      new Asphalt(),
      new Sp4ghet(),
      new Fluid(),
    ].map( ( node, i ) => {
      auto( 'stuff', ( { value } ) => {
        node.active = value === i;
        node.visible = value === i;
      } );

      return node;
    } );

    // -- speen ------------------------------------------------------------------------------------
    const speenAxis = vecNormalize( [ 1.0, 1.0, 1.0 ] ) as RawVector3;

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = quatFromAxisAngle( speenAxis, 0.1 * time );
      },
      name: process.env.DEV && 'speen',
    } );
    this.children.push( lambdaSpeen );

    // -- bounding box -----------------------------------------------------------------------------
    const boundingBox = new BoundingBox();
    boundingBox.transform.scale = [ 0.5, 0.5, 0.5 ];
    this.children.push( boundingBox );
  }
}
