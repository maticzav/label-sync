module UI exposing (colors)

import Element exposing (..)


colors :
    { yellow : Element.Color
    , blue : Element.Color
    , red : Element.Color
    , white : Element.Color
    }
colors =
    { yellow = rgb255 255 215 0
    , blue = rgb255 14 105 135
    , red = rgb255 238 0 0
    , white = rgb255 255 255 255
    }
