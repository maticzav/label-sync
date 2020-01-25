module Layout exposing (view)

-- import Element.Background as Background
-- import Element.Border as Border

import Components.Badge exposing (badge)
import Element exposing (..)
import Element.Font as Font
import Generated.Routes as Routes exposing (Route, routes)
import UI exposing (colors, fonts)
import Utils.Spa as Spa


view : Spa.LayoutContext msg -> Element msg
view { page, route } =
    column [ height fill, width fill ]
        [ viewHeader route
        , page
        ]


viewHeader : Route -> Element msg
viewHeader _ =
    row
        [ centerX
        , paddingXY 35 5
        , width (fill |> maximum 700)
        ]
        [ link [ alignLeft ]
            { label = badge { width = 150, text = "label/sync", color = "#0E698A" }
            , url = Routes.toPath routes.top
            }

        -- , link
        --     [ alignRight
        --     , Background.color colors.white
        --     , paddingXY 8 4
        --     , Font.size 20
        --     , Font.color colors.blue
        --     , Font.family [ fonts.work ]
        --     , Border.solid
        --     , Border.rounded 7
        --     , Border.width 2
        --     , Border.color colors.blue
        --     , mouseOver
        --         [ Background.color colors.blue
        --         , Border.color colors.blue
        --         ]
        --     ]
        --     { label = text "Start syncing labels!", url = "https://github.com/apps/labelsync-manager" }
        -- -- , link [ alignRight ] { label = text "Sync Labels", url = "https://calendly.com/maticzav/labelsync" }
        ]
