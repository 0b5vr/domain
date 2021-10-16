import { cache, genToken, insertTop } from '../../shader-builder/shaderBuilder';

export function glslSaturate( val: string ): string {
  const saturate = cache( 'saturate', () => {
    const token = genToken();
    insertTop( `\n#define ${ token }(i) clamp(i,0.,1.)\n` );
    return ( val: string ) => `(${ token }(${ val }))`;
  } );

  return saturate( val );
}
