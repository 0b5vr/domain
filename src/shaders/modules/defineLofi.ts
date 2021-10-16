import { genToken, insertTop } from '../../shader-builder/shaderBuilder';

export function defineLofi():
( x: string, y: string ) => string {
  const token = genToken();
  insertTop( `\n#define ${ token }(x,y) floor((x)/(y)*(y))\n` );
  return ( x, y ) => `(${ token }(${ x },${ y }))`;
}
