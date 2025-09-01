use crate::outline_builder::SvgPath;
use serde::{Deserialize, Serialize};
use std::cell::{LazyCell, RefCell};
use std::collections::HashMap;
use std::convert::From;
use ttf_parser::{Face, Tag};

// Weight (wght)

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Weight {
    W100,
    W200,
    W300,
    W400,
    W500,
    W600,
    W700,
}

impl From<Weight> for u16 {
    fn from(w: Weight) -> u16 {
        match w {
            Weight::W100 => 100,
            Weight::W200 => 200,
            Weight::W300 => 300,
            Weight::W400 => 400,
            Weight::W500 => 500,
            Weight::W600 => 600,
            Weight::W700 => 700,
        }
    }
}

// Outlines vs filled (FILL)

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Fill {
    Outline,
    Filled,
}

impl From<Fill> for u8 {
    fn from(f: Fill) -> u8 {
        match f {
            Fill::Outline => 1,
            Fill::Filled => 0,
        }
    }
}

// Grade (GRAD) finer adjustments

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Grade {
    Gneg50,
    Gneg25,
    G0,
    G200,
}

impl From<Grade> for i16 {
    fn from(g: Grade) -> i16 {
        match g {
            Grade::Gneg50 => -50,
            Grade::Gneg25 => -25,
            Grade::G0 => 0,
            Grade::G200 => 200,
        }
    }
}

// Optical size (opsz)

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum OpticalSize {
    O20,
    O24,
    O40,
    O48,
}

impl From<OpticalSize> for u16 {
    fn from(o: OpticalSize) -> u16 {
        match o {
            OpticalSize::O20 => 20,
            OpticalSize::O24 => 24,
            OpticalSize::O40 => 40,
            OpticalSize::O48 => 48,
        }
    }
}

// SVG generation

pub static MATERIAL_SYMBOLS_TTF: &[u8] = include_bytes!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/font/material-symbols-outlined.ttf"
));

pub static CODEPOINTS: &[u8] = include_bytes!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/font/material-symbols-outlined.codepoints"
));

thread_local! {
// One RefCell<Face> per wasm instance/thread
static FACE: LazyCell<RefCell<Face<'static>>> = LazyCell::new(|| {
    let face = Face::parse(MATERIAL_SYMBOLS_TTF, 0).expect("valid font");
    RefCell::new(face)
});
}

#[derive(Serialize, Deserialize)]
pub struct GeneratePathsConfig {
    pub weights: Vec<Weight>,
    pub grade: Vec<Grade>,
    pub fill: Fill,
    pub optical_sizes: Vec<OpticalSize>,
}

pub fn generate_paths(
    icon_name: String,
    config: GeneratePathsConfig,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    FACE.with(|cell| {
        let mut face = cell.borrow_mut();

        let codepoints = parse_codepoints()?;
        let codepoint_value = u32::from_str_radix(codepoints[&icon_name].as_str(), 16)?;
        let c = char::from_u32(codepoint_value).ok_or("Invalid codepoint")?;
        let glyph_id = face.glyph_index(c).ok_or("Glyph not found")?;

        // The glyphs need to be uniformly sized
        let upm = face.units_per_em();
        let target_size: f32 = 48.0;
        let scale = target_size / upm as f32;

        let svgs = config
            .weights
            .iter()
            .map(|weight| {
                let mut svg_path_builder = SvgPath::new();
                svg_path_builder.scale_factor = scale;
                let converted_weight = (u16::from(*weight) as f32) / 1000.0_f32;

                face.outline_glyph(glyph_id, &mut svg_path_builder);
                face.set_variation(Tag::from_bytes(b"wght"), 0.667);

                let view_box = "0 -48 48 48";
                let wrapped_svg = wrap_svg(svg_path_builder.path.as_str(), view_box);
                println!("{}", wrapped_svg);
                return wrapped_svg;
            })
            .collect::<Vec<_>>();

        Ok(svgs)
    })
}

fn parse_codepoints() -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let codepoints_text = String::from_utf8_lossy(CODEPOINTS)
        .lines()
        .map(|line| {
            let parts: Vec<_> = line.split_whitespace().collect();
            (parts[0].to_string(), parts[1].to_string())
        })
        .collect::<HashMap<String, String>>();
    Ok(codepoints_text)
}

fn wrap_svg(path_data: &str, view_box: &str) -> String {
    format!(
        r#"<svg viewBox="{}" xmlns="http://www.w3.org/2000/svg"><path d="{}"/></svg>"#,
        view_box, path_data
    )
}
