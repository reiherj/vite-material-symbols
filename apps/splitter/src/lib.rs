use wasm_bindgen::prelude::*;

pub mod generate_paths;
pub mod outline_builder;

pub use generate_paths::generate_paths;

#[wasm_bindgen]
pub fn get_icon(icon_name: &str, weight: i16) -> Result<String, JsError> {
    match generate_paths(icon_name, weight) {
        Ok(val) => Ok(val),
        Err(_) => Err(JsError::new("error!")),
    }
}
