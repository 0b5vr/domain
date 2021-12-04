import { AdvantageCube } from './AdvantageCube';
import { Asphalt } from './Asphalt';
import { BoundingBox } from './BoundingBox';
import { BumpBlock } from './BumpBlock';
import { CRT } from './CRT';
import { Cardboard } from './Cardboard';
import { Crate } from './Crate';
import { CubeRoot } from './CubeRoot';
import { Dice } from './Dice';
import { Esc } from './Esc';
import { Fluid } from './Fluid';
import { GridCube } from './GridCube';
import { IFSCube } from './IFSCube';
import { Info } from './Info';
import { Iridescent } from './Iridescent';
import { Lambda } from '../heck/components/Lambda';
import { MengerSponge } from './MengerSponge';
import { NotchyStuff } from './NotchyStuff';
import { ObsvrCube } from './ObsvrCube';
import { Octree } from './Octree';
import { Oscilloscope } from './Oscilloscope';
import { ParkingSpace } from './ParkingSpace';
import { Particles } from './Particles';
import { RandomTextureCube } from './RandomTextureCube';
import { RawVector3, quatFromAxisAngle, vecNormalize } from '@0b5vr/experimental';
import { SSSBox } from './SSSBox';
import { SceneNode } from '../heck/components/SceneNode';
import { Sierpinski } from './Sierpinski';
import { SingleStep } from './SingleStep';
import { Sky } from './Sky';
import { Sp4ghet } from './Sp4ghet';
import { TAU } from '../utils/constants';
import { Trails } from './Trails';
import { Traveler } from './Traveler';
import { UVGradientCube } from './UVGradientCube';
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

    // -- speen ------------------------------------------------------------------------------------
    const speenAxis = vecNormalize( [ 1.0, 1.0, 1.0 ] ) as RawVector3;

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = quatFromAxisAngle(
          speenAxis,
          0.1 * time + auto( 'stuff/rotOffset' ) * TAU / 3.0,
        );
      },
      name: process.env.DEV && 'speen',
    } );
    this.children.push( lambdaSpeen );

    // -- bounding box -----------------------------------------------------------------------------
    const boundingBox = new BoundingBox();
    boundingBox.transform.scale = [ 0.55, 0.55, 0.55 ];
    this.children.push( boundingBox );

    // -- children ---------------------------------------------------------------------------------
    this.children.push( ...[
      new SingleStep(),
      new SSSBox(),
      new MengerSponge(),
      new Asphalt(),
      new ObsvrCube(),
      new Sp4ghet(),
      new Fluid(),
      new RandomTextureCube(),
      new WebpackCube(),
      new Info(),
      new WarningCube(),
      new ParkingSpace(),
      new Octree(),
      new AdvantageCube(),
      new Crate(),
      new Cardboard(),
      new Particles(),
      new Trails(),
      new GridCube(),
      new Sierpinski(),
      new NotchyStuff(),
      new Oscilloscope(),
      new CubeRoot(),
      new IFSCube(),
      new Iridescent(),
      new Dice(),
      new Esc(),
      new Traveler(),
      new CRT(),
      new UVGradientCube(),
      new Sky(),
      new BumpBlock(),
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

      auto( 'stuff/prewarm', ( { value } ) => {
        if ( value === i ) {
          node.active = true;
        }
      } );

      return node;
    } ) );
  }
}
