use std::fs;
use std::collections::HashMap;
use ttf_parser::Face;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // let data = fs::read("./font/DejaVuSans.ttf")?;
    let data = fs::read("./font/MaterialIcons-Regular.ttf")?;
    let face = Face::parse(&data, 0)?;

    // Print some basic font info
    print_basic_font_info(&face);

    // Parse codepoints
    let codepoints = parse_codepoints("./font/MaterialIcons-Regular.codepoints")?;

    // Get some glyph
    let codepoint_value = u32::from_str_radix(codepoints["menu"].as_str(), 16)?;
    if let Some(c) = char::from_u32(codepoint_value) {
        if let Some(glyph_id) = face.glyph_index(c) {
            println!("Glyph ID: {}", glyph_id.0)
        };
    }

    Ok(())
}

fn print_basic_font_info(face: &Face) {
    let is_reg = face.is_regular();

    let names = face.names();
    let names_iter = names.into_iter();

    for name in names_iter {
        if let Some(i) = name.to_string() {
            println!("{}", i);
        };
    }

    println!("Font is regualar? {}", is_reg);
    println!("Number of glyphs: {}", face.number_of_glyphs());
}

fn parse_codepoints(path: &str) -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let codepoints_text = fs::read_to_string(path)?
        .lines()
        .map(|line| {
            let parts: Vec<_> = line.split_whitespace().collect();
            (parts[0].to_string(), parts[1].to_string())
        })
        .collect::<HashMap<String, String>>();
    Ok(codepoints_text)
}
