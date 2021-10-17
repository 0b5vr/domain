import { cache, genToken, insertTop } from '../../shader-builder/shaderBuilder';

const symbol = Symbol();

export function glslLofi( x: string, y: string ): string {
  const lofi = cache( symbol, () => {
    const token = genToken();
    insertTop( `\n#define ${ token }(x,y) floor((x)/(y)*(y))\n` );
    return ( x: string, y: string ) => `(${ token }(${ x },${ y }))`;
  } );

  return lofi( x, y );
}
