import { CharCanvasTexture } from './CharCanvasTexture/CharCanvasTexture';
import { auto } from './automaton';
import { getYugoppText } from '../utils/getYugoppText';

export const charCanvasTexture = new CharCanvasTexture();

const texts = [
  [ 'sss_box', 'subsurface scatter-brain' ],
  [ 'menger_sponge', 'fractal dimension = 2.7268...' ],
  [ 'asphalt', 'high-octane flavored' ],
  [ 'sp4ghet', 'angura girl with a torus-knot' ],
  [ 'fluid', 'the incomprehensible flow' ],
  [ 'xorshit', 'shut up my brain' ],
  [ 'webpack', 'still suffering in the minifier hell' ],
  [ 'infodesk', 'need some help? same' ],
  [ 'warning', 'gl_invalid_operation' ],
  [ 'parking_space', 'beware of floating cubes' ],
  [ 'octree', 'does not shaped like a tree' ],
];

auto( 'FUI/yugopp', ( { progress } ) => {
  const stuffIndex = auto( 'stuff' );
  const t = texts[ stuffIndex ];

  if ( t != null ) {
    const indexText = ( '0' + stuffIndex ).slice( -2 );

    charCanvasTexture.clear();
    charCanvasTexture.drawChars( 54, 64, 8.8, getYugoppText( indexText, progress * 4.0 ) );
    charCanvasTexture.drawChars( 290, 103, 5.5, getYugoppText( t[ 0 ], progress * 2.0 - 0.25 ) );
    charCanvasTexture.drawChars( 290, 60, 2, getYugoppText( t[ 1 ], progress * 2.0 - 0.5 ) );
    charCanvasTexture.updateTexture();
  }
} );
