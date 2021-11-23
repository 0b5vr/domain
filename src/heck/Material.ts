import { GLCatProgram, GLCatProgramLinkOptions, GLCatProgramUniformMatrixVectorType, GLCatProgramUniformType, GLCatProgramUniformVectorType, GLCatTexture } from '@fms-cat/glcat-ts';
import { Geometry } from './Geometry';
import { RenderTarget } from './RenderTarget';
import { SHADERPOOL } from './ShaderPool';
import { gl, glCat } from '../globals/canvas';

export type MaterialTag =
  | 'deferred'
  | 'forward'
  | 'cubemap'
  | 'depth';

export type MaterialMap = { [ tag in MaterialTag ]?: Material };

export interface MaterialInitOptions {
  target: RenderTarget;
  geometry: Geometry;
}

export class Material {
  protected __linkOptions: GLCatProgramLinkOptions;

  protected __uniforms: {
    [ name: string ]: {
      type: GLCatProgramUniformType;
      value: number[];
    };
  } = {};

  protected __uniformVectors: {
    [ name: string ]: {
      type: GLCatProgramUniformVectorType;
      value: Float32List | Int32List;
    };
  } = {};

  protected __uniformMatrixVectors: {
    [ name: string ]: {
      type: GLCatProgramUniformMatrixVectorType;
      value: Float32List | Int32List;
      transpose?: boolean;
    };
  } = {};

  protected __uniformTextures: {
    [ name: string ]: {
      textures: GLCatTexture[];
    };
  } = {};

  private __vert: string;

  public get vert(): string {
    return this.__vert;
  }

  private __frag: string;

  public get frag(): string {
    return this.__frag;
  }

  public get program(): GLCatProgram {
    return SHADERPOOL.getProgram(
      this,
      this.vert,
      this.frag,
    );
  }

  public blend: [ GLenum, GLenum ];

  public constructor(
    vert: string,
    frag: string,
    { blend, linkOptions, initOptions }: {
      blend?: [ GLenum, GLenum ],
      linkOptions?: GLCatProgramLinkOptions,
      initOptions?: MaterialInitOptions,
    } = {},
  ) {
    this.__vert = vert;
    this.__frag = frag;
    this.__linkOptions = linkOptions ?? {};
    this.blend = blend ?? [ gl.ONE, gl.ZERO ];

    if ( initOptions ) {
      this.d3dSucks( initOptions );
    } else {
      if ( process.env.DEV ) {
        console.warn( 'Material created without initOptions' );
      }
    }
  }

  public addUniform( name: string, type: GLCatProgramUniformType, ...value: number[] ): void {
    this.__uniforms[ name ] = { type, value };
  }

  public addUniformVector(
    name: string,
    type: GLCatProgramUniformVectorType,
    value: Float32List | Int32List
  ): void {
    this.__uniformVectors[ name ] = { type, value };
  }

  public addUniformMatrixVector(
    name: string,
    type: GLCatProgramUniformMatrixVectorType,
    value: Float32List | Int32List
  ): void {
    this.__uniformMatrixVectors[ name ] = { type, value };
  }

  public addUniformTextures( name: string, ...textures: GLCatTexture[] ): void {
    this.__uniformTextures[ name ] = { textures };
  }

  public setUniforms(): void {
    const program = this.program;

    Object.entries( this.__uniforms ).forEach( ( [ name, { type, value } ] ) => {
      program.uniform( name, type, ...value );
    } );

    Object.entries( this.__uniformVectors ).forEach( ( [ name, { type, value } ] ) => {
      program.uniformVector( name, type, value );
    } );

    Object.entries( this.__uniformMatrixVectors ).forEach(
      ( [ name, { type, value, transpose } ] ) => {
        program.uniformMatrixVector( name, type, value, transpose );
      }
    );

    Object.entries( this.__uniformTextures ).forEach( ( [ name, { textures } ] ) => {
      program.uniformTexture( name, ...textures );
    } );
  }

  public setBlendMode(): void {
    gl.blendFunc( ...this.blend );
  }

  public async replaceShader(
    vert: string,
    frag: string,
    options?: {
      defines?: string[],
      linkOptions?: GLCatProgramLinkOptions,
    },
  ): Promise<void> {
    const program = await SHADERPOOL.getProgramAsync(
      this,
      this.__vert,
      this.__frag,
      options?.linkOptions,
    ).catch( ( e ) => {
      console.error( e );
    } );

    if ( program ) {
      const prevVert = this.vert;
      const prevFrag = this.frag;

      this.__vert = vert;
      this.__frag = frag;

      SHADERPOOL.discardProgram( this, prevVert, prevFrag );
    }
  }

  /**
   * "Compile the shader code".
   * Blame ANGLE instead tbh
   *
   * See: https://scrapbox.io/0b5vr/WebGL:_%E3%82%B7%E3%82%A7%E3%83%BC%E3%83%80%E3%81%AE%E3%82%B3%E3%83%B3%E3%83%91%E3%82%A4%E3%83%AB%E3%81%8C%E6%8F%8F%E7%94%BB%E9%96%8B%E5%A7%8B%E6%99%82%E3%81%AB%E7%99%BA%E7%94%9F%E3%81%97%E3%81%A6stall%E3%81%99%E3%82%8B
   */
  public d3dSucks( { geometry, target }: MaterialInitOptions ): void {
    target.bind();
    glCat.useProgram( this.program, () => {
      geometry.drawElementsOrArrays();
    } );
  }
}
