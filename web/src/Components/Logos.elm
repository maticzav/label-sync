module Components.Logos exposing (prisma, zeit)

import Element exposing (Element, html)
import Svg exposing (..)
import Svg.Attributes exposing (..)


prisma : Element msg
prisma =
    svg
        [ viewBox "0 0 34 40"
        , width "51"
        , height "60"
        , fill "currentColor"
        , class "Nav__LogoMark-sc-11gnase-3 dUeojx"
        ]
        [ Svg.path
            [ fillRule "evenodd"
            , clipRule "evenodd"
            , d "M32.908 30.475L19.151 1.26a2.208 2.208 0 0 0-1.88-1.257 2.183 2.183 0 0 0-2.01 1.042L.34 25.212a2.26 2.26 0 0 0 .025 2.426L7.66 38.935a2.346 2.346 0 0 0 2.635.969l21.17-6.262a2.32 2.32 0 0 0 1.457-1.258 2.27 2.27 0 0 0-.013-1.91zm-3.08 1.253L11.864 37.04c-.548.163-1.074-.312-.96-.865l6.418-30.731c.12-.575.914-.666 1.165-.134l11.881 25.23a.858.858 0 0 1-.541 1.188z"
            ]
            []
        ]
        |> html


zeit : Element msg
zeit =
    svg [ viewBox "0 0 226 200", width "60", height "60" ]
        [ defs []
            [ linearGradient
                [ x1 "196.572%"
                , y1 "228.815%"
                , x2 "50%"
                , y2 "50%"
                , id "logo-1"
                ]
                [ stop
                    [ offset "0%"
                    , stopColor "var(--geist-background)"
                    ]
                    []
                , stop
                    [ offset "100%"
                    , stopColor "var(--geist-foreground)"
                    ]
                    []
                ]
            ]
        , Svg.path
            [ fill
                "url(#logo-1)"
            , d "M254 156.46L367 356H141z"
            , transform "translate(-141 -156)"
            ]
            []
        ]
        |> html
