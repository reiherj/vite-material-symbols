use wasm_bindgen::prelude::*;

pub mod console;
pub mod generate_paths;
pub mod outline_builder;

use crate::generate_paths::{generate_paths, GeneratePathsConfig};

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
export type GeneratePathsConfig = {
    weights: Weight[];
    grade: Grade[];
    fill: Fill;
    optical_sizes: OpticalSize[];
}

export type Weight = "W100" | "W200" | "W300" | "W400" | "W500" | "W600" | "W700";
export type Fill = "Outline" | "Filled";
export type Grade = "Gneg50" | "Gneg25" | "G0" | "G200";
export type OpticalSize = "O20" | "O24" | "O40" | "O48";
"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "GeneratePathsConfig")]
    pub type GeneratePathsConfigJs;
}

#[wasm_bindgen]
pub fn get_icon(icon_name: String, options: GeneratePathsConfigJs) -> Result<Vec<String>, JsError> {
    let config = serde_wasm_bindgen::from_value::<GeneratePathsConfig>(options.into())?;

    match generate_paths(icon_name, config) {
        Ok(val) => Ok(val),
        Err(_) => Err(JsError::new("error!")),
    }
}
