module Pages.Top exposing (Model, Msg, page)

import Components.Logo as Logo
import Element exposing (..)
import Element.Font as Font
import Generated.Params as Params
import Spa.Page
import Utils.Spa exposing (Page)


type alias Model =
    ()


type alias Msg =
    Never


page : Page Params.Top Model Msg model msg appMsg
page =
    Spa.Page.static
        { title = always "homepage"
        , view = always view
        }



-- VIEW


view : Element Msg
view =
    column
        [ centerX
        , centerY
        , spacing 24
        ]
        [ row []
            [ row []
                [ html (Logo.logo { width = "300px", height = "150px" })
                ]
            , row [] [ text "The missing Github labels manager." ]
            ]
        ]
