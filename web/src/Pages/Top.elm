module Pages.Top exposing (Model, Msg, page)

import Components.Badge exposing (badge)
import Components.Logos as Logos
import Components.Stripe exposing (stripe)
import Element exposing (..)
import Element.Background as Background
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


story : String
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
            [ image [ centerX, width fill ]
                { description = "Github Issues View"
                , src = "/images/thumbnail.png"
                }
            ]
        , section "Story"
            [ paragraph
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
        , section "Features"
            [ row [ width fill ]
                [ column [ width fill, paddingXY 15 10 ]
                    [ image [ width fill ]
                        { src = "/images/issues.png"
                        , description = "Issues feature."
                        }
                    ]
                , column [ width fill, spacing 10, paddingXY 15 10 ]
                    [ subheading "Label driven workflow"
                    , paragraph [ width fill, paddingXY 10 0 ]
                        [ text """
                            Sync your labels and let them drive your
                            workflow.
                        """
                        ]
                    ]
                ]
            , row [ width fill ]
                [ column [ width fill, spacing 10, paddingXY 15 10 ]
                    [ subheading "Label driven workflow"
                    , paragraph [ width fill, paddingXY 10 0 ]
                        [ text """
                            Sync your labels and let them drive your
                            workflow.
                        """
                        ]
                    ]
                , column [ width fill, paddingXY 15 10 ]
                    [ image [ width fill ]
                        { src = "/images/issues.png"
                        , description = "Issues feature."
                        }
                    ]
                ]
            , row [ width fill ]
                [ column [ width fill, paddingXY 15 10 ]
                    [ image [ width fill ]
                        { src = "/images/issues.png"
                        , description = "Issues feature."
                        }
                    ]
                , column [ width fill, spacing 10, paddingXY 15 10 ]
                    [ subheading "Label driven workflow"
                    , paragraph [ width fill, paddingXY 10 0 ]
                        [ text """
                            Sync your labels and let them drive your
                            workflow.
                        """
                        ]
                    ]
                ]
            ]
        , column
            [ width fill
            , Background.color (rgb255 250 250 250)
            , paddingXY 20 40
            , spacing 30
            , centerX
            ]
            [ el
                [ Font.family [ fonts.work ]
                , Font.size 30
                , Font.bold
                , Font.color colors.black
                , centerX
                ]
                (text "Trusted by experts")
            , row
                [ spacing 55
                , centerX
                , width (fill |> maximum 600)
                ]
                [ el [ centerX ] Logos.prisma
                , el [ centerX ] Logos.zeit
                ]
            ]
        , section "Interested?"
            [ row [] [] ]
        ]


subheading : String -> Element msg
subheading head =
    el
        [ Font.family [ fonts.work ]
        , Font.size 25
        , Font.bold
        , Font.color colors.black
        ]
        (text head)


section : String -> List (Element msg) -> Element msg
section heading els =
    column
        [ width (fill |> maximum 900)
        , paddingXY 20 40
        , spacing 15
        , centerX
        ]
        (el
            [ Font.family [ fonts.work ]
            , Font.size 30
            , Font.bold
            , Font.color colors.black
            , centerX
            ]
            (text heading)
            :: els
        )
