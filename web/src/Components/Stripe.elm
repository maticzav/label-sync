module Components.Stripe exposing (stripe)

import Element exposing (..)
import Element.Background as Background
import Element.Border as Border
import Element.Font as Font
import Html.Attributes as Attr


labels : List ( String, Element.Color )
labels =
    [ ( "bug/0-needs-info", rgb255 238 0 0 )
    , ( "area/database", rgb255 251 202 4 )
    , ( "kind/improvement", rgb255 59 91 219 )
    , ( "bug/2-confirmed", rgb255 238 0 0 )
    , ( "kind/bug", rgb255 59 91 219 )
    , ( "area/docs", rgb255 251 202 4 )
    , ( "kind/feature", rgb255 59 91 219 )
    , ( "status/stale", rgb 36 218 141 )
    ]


stripe : Element msg
stripe =
    row
        [ width (fill |> maximum 700)
        , spacing 15
        , paddingXY 0 10
        , centerX
        , Element.htmlAttribute <| Attr.id "stripe"
        ]
        (List.map viewLabel labels)


viewLabel : ( String, Element.Color ) -> Element msg
viewLabel ( label, color ) =
    el
        [ Background.color color
        , Border.rounded 3
        , Font.color (rgb255 255 255 255)
        , Font.size 14
        , Font.bold
        , paddingXY 5 3
        , Font.family [ Font.sansSerif ]
        , Border.innerShadow
            { offset = ( 0.0, -0.4 )
            , size = 0.0
            , blur = 2.0
            , color = rgb255 27 31 35
            }
        ]
        (text label)
