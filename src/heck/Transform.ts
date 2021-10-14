import { RawMatrix4, RawQuaternion, RawVector3, mat4Compose, mat4Decompose, mat4LookAt, mat4Multiply } from '@0b5vr/experimental';

export class Transform {
  protected __position: RawVector3;

  public get position(): RawVector3 {
    return this.__position;
  }

  public set position( vector: RawVector3 ) {
    this.__position = vector;

    this.__matrix = mat4Compose( this.__position, this.__rotation, this.__scale );
    this.__isIdentity = false;
  }

  protected __rotation: RawQuaternion;

  public get rotation(): RawQuaternion {
    return this.__rotation;
  }

  public set rotation( quaternion: RawQuaternion ) {
    this.__rotation = quaternion;

    this.__matrix = mat4Compose( this.__position, this.__rotation, this.__scale );
    this.__isIdentity = false;
  }

  protected __scale: RawVector3;

  public get scale(): RawVector3 {
    return this.__scale;
  }

  public set scale( vector: RawVector3 ) {
    this.__scale = vector;

    this.__matrix = mat4Compose( this.__position, this.__rotation, this.__scale );
    this.__isIdentity = false;
  }

  protected __matrix: RawMatrix4;

  public get matrix(): RawMatrix4 {
    return this.__matrix;
  }

  public set matrix( matrix: RawMatrix4 ) {
    this.__matrix = matrix;

    const { position, rotation, scale } = mat4Decompose( this.__matrix );
    this.__position = position;
    this.__rotation = rotation;
    this.__scale = scale;
    this.__isIdentity = false;
  }

  protected __isIdentity: boolean;

  public constructor() {
    this.__position = [ 0.0, 0.0, 0.0 ];
    this.__rotation = [ 0.0, 0.0, 0.0, 1.0 ];
    this.__scale = [ 1.0, 1.0, 1.0 ];
    this.__matrix = [
      1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0,
    ];
    this.__isIdentity = true;
  }

  public lookAt( position: RawVector3, target?: RawVector3, up?: RawVector3, roll?: number ): void {
    this.matrix = mat4LookAt( position, target, up, roll );
  }

  public multiply( transform: Transform ): Transform {
    if ( transform.__isIdentity ) {
      return this;
    }

    const result = new Transform();
    result.matrix = mat4Multiply( this.__matrix, transform.__matrix );
    return result;
  }
}
