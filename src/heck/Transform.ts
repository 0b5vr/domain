import { Matrix4, Quaternion, Vector3 } from '@0b5vr/experimental';

export class Transform {
  protected __position: Vector3;

  public get position(): Vector3 {
    return this.__position;
  }

  public set position( vector: Vector3 ) {
    this.__position = vector;

    this.__matrix = Matrix4.compose( this.__position, this.__rotation, this.__scale );
    this.__isIdentity = false;
  }

  protected __rotation: Quaternion;

  public get rotation(): Quaternion {
    return this.__rotation;
  }

  public set rotation( quaternion: Quaternion ) {
    this.__rotation = quaternion;

    this.__matrix = Matrix4.compose( this.__position, this.__rotation, this.__scale );
    this.__isIdentity = false;
  }

  protected __scale: Vector3;

  public get scale(): Vector3 {
    return this.__scale;
  }

  public set scale( vector: Vector3 ) {
    this.__scale = vector;

    this.__matrix = Matrix4.compose( this.__position, this.__rotation, this.__scale );
    this.__isIdentity = false;
  }

  protected __matrix: Matrix4;

  public get matrix(): Matrix4 {
    return this.__matrix;
  }

  public set matrix( matrix: Matrix4 ) {
    this.__matrix = matrix;

    const decomposed = this.__matrix.decompose();
    this.__position = decomposed.position;
    this.__rotation = decomposed.rotation;
    this.__scale = decomposed.scale;
    this.__isIdentity = false;
  }

  protected __isIdentity: boolean;

  public constructor() {
    this.__position = Vector3.zero;
    this.__rotation = Quaternion.identity;
    this.__scale = Vector3.one;
    this.__matrix = Matrix4.identity;
    this.__isIdentity = true;
  }

  public lookAt( position: Vector3, target?: Vector3, up?: Vector3, roll?: number ): void {
    this.matrix = Matrix4.lookAt( position, target, up, roll );
  }

  public multiply( transform: Transform ): Transform {
    if ( transform.__isIdentity ) {
      return this;
    }

    const result = new Transform();
    result.matrix = this.matrix.multiply( transform.matrix );
    return result;
  }
}
