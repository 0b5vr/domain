import { HALF_SQRT_TWO } from '../utils/constants';
import { SceneNode } from '../heck/components/SceneNode';
import { Wall } from './Wall';

export class Walls extends SceneNode {
  public constructor() {
    super();

    const wallN = new Wall();
    wallN.transform.position = [ 0.0, 8.0, -8.0 ];

    const wallS = new Wall();
    wallS.transform.position = [ 0.0, 8.0, 8.0 ];
    wallS.transform.rotation = [ 0.0, 1.0, 0.0, 0.0 ];

    const wallW = new Wall();
    wallW.transform.position = [ -8.0, 8.0, 0.0 ];
    wallW.transform.rotation = [ 0.0, HALF_SQRT_TWO, 0.0, HALF_SQRT_TWO ];

    const wallE = new Wall();
    wallE.transform.position = [ 8.0, 8.0, 0.0 ];
    wallE.transform.rotation = [ 0.0, -HALF_SQRT_TWO, 0.0, HALF_SQRT_TWO ];

    if ( process.env.DEV ) {
      wallN.name = 'wallN';
      wallS.name = 'wallS';
      wallW.name = 'wallW';
      wallE.name = 'wallE';
    }

    this.children = [ wallN, wallS, wallW, wallE ];
  }
}
