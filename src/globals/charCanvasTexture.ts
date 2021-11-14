import { CharCanvasTexture } from './CharCanvasTexture/CharCanvasTexture';
import { auto } from './automaton';
import { getYugoppText } from '../utils/getYugoppText';

export const charCanvasTexture = new CharCanvasTexture();

const texts = [
  [ 'sss_box', 'screen space scatter-brain' ],
  [ 'menger_sponge', 'fractal dimension = 2.7268...' ],
  [ 'asphalt', 'high-octane flavored' ],
  [ 'sp4ghet', 'angura girl with a torus-knot' ],
  [ 'fluid', 'the incomprehensible flow' ],
];

auto( 'FUI/yugopp', ( { progress } ) => {
  const stuffIndex = auto( 'stuff' );
  const t = texts[ stuffIndex ];

  if ( t != null ) {
    const indexText = ( '0' + stuffIndex ).slice( -2 );

    charCanvasTexture.clear();
    charCanvasTexture.drawChars( 50, 60, 9, getYugoppText( indexText, progress * 4.0 ) );
    charCanvasTexture.drawChars( 280, 103, 5.5, getYugoppText( t[ 0 ], progress * 2.0 - 0.25 ) );
    charCanvasTexture.drawChars( 280, 60, 2, getYugoppText( t[ 1 ], progress * 2.0 - 0.5 ) );
    charCanvasTexture.updateTexture();
  }
} );
