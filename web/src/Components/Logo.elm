module Components.Logo exposing (logo)

import Html exposing (Html)
import Svg exposing (..)
import Svg.Attributes exposing (..)


logo : { width : String, height : String } -> Html msg
logo options =
    svg
        [ width options.width, height options.height, viewBox "0 0 900 450", version "1.1" ]
        [ desc [] []
        , defs []
            [ rect
                [ id "path-1"
                , x "37"
                , y "125"
                , width "826.636364"
                , height "200"
                , rx "20"
                ]
                []
            , Svg.filter
                [ x "-0.1%"
                , y "-0.8%"
                , width "100.1%"
                , height "101.0%"
                , filterUnits "objectBoundingBox"
                , id "filter-2"
                ]
                [ feOffset
                    [ dx "0"
                    , dy "-1"
                    , in_ "SourceAlpha"
                    , result "shadowOffsetOuter1"
                    ]
                    []
                , feColorMatrix [ values "0 0 0 0 0.105882353   0 0 0 0 0.121568627   0 0 0 0 0.137254902  0 0 0 0.12 0", in_ "shadowOffsetOuter1" ] []
                ]
            , Svg.filter
                [ x "-0.7%"
                , y "-3.2%"
                , width "101.3%"
                , height "106.0%"
                , filterUnits "objectBoundingBox"
                , id "filter-3"
                ]
                [ feGaussianBlur [ stdDeviation "1.5", in_ "SourceAlpha", result "shadowBlurInner1" ] [], feOffset [ dx "0", dy "-8", in_ "shadowBlurInner1", result "shadowOffsetInner1" ] [], feComposite [ in_ "shadowOffsetInner1", in2 "SourceAlpha", operator "arithmetic", k2 "-1", k3 "1", result "shadowInnerInner1" ] [], feColorMatrix [ values "0 0 0 0 0.105882353   0 0 0 0 0.121568627   0 0 0 0 0.137254902  0 0 0 0.5 0", in_ "shadowInnerInner1" ] [] ]
            ]
        , g
            [ id "Logo-Blue"
            , stroke "none"
            , strokeWidth "1"
            , fill "none"
            , fillRule "evenodd"
            ]
            [ g [ id "Rectangle" ]
                [ use [ fill "black", fillOpacity "1", Svg.Attributes.filter "url(#filter-2)", xlinkHref "#path-1" ] []
                , use [ fill "#0E698A", fillRule "evenodd", xlinkHref "#path-1" ] []
                , use [ fill "black", fillOpacity "1", Svg.Attributes.filter "url(#filter-3)", xlinkHref "#path-1" ] []
                ]
            , text_ [ id "label/sync", fontFamily "HelveticaNeue-Bold, Helvetica Neue", fontSize "150", fontWeight "bold", fill "#FFFFFF" ] [ tspan [ x "85", y "277" ] [ text "label/sync" ] ]
            ]
        ]
