module UI exposing (colors, fonts)

import Element as Element exposing (rgb255)
import Element.Font as Font


colors :
    { yellow : Element.Color
    , blue : Element.Color
    , red : Element.Color
    , white : Element.Color
    , grey : Element.Color
    , black : Element.Color
    }
colors =
    { yellow = rgb255 255 215 0
    , blue = rgb255 14 105 135
    , red = rgb255 238 0 0
    , white = rgb255 255 255 255
    , grey = rgb255 179 179 179
    , black = rgb255 68 68 68
    }


fonts :
    { work : Font.Font
    , alegreya : Font.Font
    }
fonts =
    { work = Font.typeface "Work Sans"
    , alegreya = Font.typeface "Alegreya Sans"
    }
