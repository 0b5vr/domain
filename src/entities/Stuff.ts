import { AdvantageCube } from './AdvantageCube';
import { Asphalt } from './Asphalt';
import { BoundingBox } from './BoundingBox';
import { Cardboard } from './Cardboard';
import { Crate } from './Crate';
import { Fluid } from './Fluid';
import { Info } from './Info';
import { Lambda } from '../heck/components/Lambda';
import { MengerSponge } from './MengerSponge';
import { Octree } from './Octree';
import { ParkingSpace } from './ParkingSpace';
import { Particles } from './Particles';
import { PoolLAN } from './PoolLAN';
import { RandomTextureCube } from './RandomTextureCube';
import { RawVector3, quatFromAxisAngle, vecNormalize } from '@0b5vr/experimental';
import { SSSBox } from './SSSBox';
import { SceneNode } from '../heck/components/SceneNode';
import { SingleStep } from './SingleStep';
import { Sp4ghet } from './Sp4ghet';
import { Trails } from './Trails';
import { WarningCube } from './WarningCube';
import { WebpackCube } from './WebpackCube';
import { auto } from '../globals/automaton';

export const StuffTag = Symbol();

export class Stuff extends SceneNode {
  public constructor() {
    super();

    this.tags = [ StuffTag ];

    this.transform.position = [ 0.0, 3.0, 0.0 ];
    this.transform.scale = [ 3.0, 3.0, 3.0 ];

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      new SingleStep(),
      new SSSBox(),
      new MengerSponge(),
      new Asphalt(),
      new Sp4ghet(),
      new Fluid(),
      new RandomTextureCube(),
      new WebpackCube(),
      new Info(),
      new WarningCube(),
      new ParkingSpace(),
      new Octree(),
      new PoolLAN(),
      new AdvantageCube(),
      new Crate(),
      new Cardboard(),
      new Particles(),
      new Trails(),
    ].map( ( node, i ) => {
      if ( process.env.DEV ) {
        const current = auto( 'stuff' );
        node.active = current === i;
        node.visible = current === i;
      }

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
    boundingBox.transform.scale = [ 0.55, 0.55, 0.55 ];
    this.children.push( boundingBox );
  }
}
