module Pages.Top exposing (Model, Msg, page)

import Components.Badge exposing (badge)
import Components.Stripe exposing (stripe)
import Element exposing (..)
import Element.Font as Font
import Generated.Params as Params
import Spa.Page
import UI exposing (colors, fonts)
import Utils.Spa exposing (Page)


type alias Model =
    ()


type alias Msg =
    Never


page : Page Params.Top Model Msg model msg appMsg
page =
    Spa.Page.static
        { title = always "LabelSync"
        , view = always view
        }



-- VIEW


story =
    """
    As an open source developer, it was super hard to sync labels
    accross all of my projects. I built LabelSync to help me keep my
    repositories clean and in sync.
    """


view : Element Msg
view =
    column
        [ width fill, height fill ]
        [ row [ width fill ]
            [ image [ centerX, width (px 500) ] { description = "Github Issues View", src = "/images/issues.png" }
            ]
        , column
            [ width fill, centerX, paddingXY 20 40, spacing 15 ]
            [ el
                [ Font.family [ fonts.work ]
                , Font.size 30
                , Font.bold
                , Font.color colors.black
                , centerX
                ]
                (text "Story")
            , paragraph
                [ Font.family [ fonts.work ]
                , Font.size 25
                , Font.center
                , Font.color colors.black
                , width (px 500)
                , centerX
                ]
                [ text story
                ]
            , el
                [ Font.family [ fonts.work ]
                , Font.size 15
                , Font.color colors.grey
                , centerX
                ]
                (text "- Matic Zavadlal, Maker of LabelSync")
            ]
        , stripe
        , column [ width fill, height fill ] [ text "hey" ]
        ]
