use splitter::path_generation::{generate_paths, Fill, GeneratePathsConfig, Weight};
use std::fs;
use std::path::Path;

fn main() {
    let svg_string = generate_paths(
        String::from("menu"),
        GeneratePathsConfig {
            weights: vec![Weight::W400, Weight::W600],
            grade: vec![],
            fill: Fill::Outline,
            optical_sizes: vec![],
        },
    )
    .expect("Icon path.");

    let mut count = 0;

    for svg in svg_string {
        let file_name = format!("svg_{count}");
        let mut file_path = Path::new("dist").join(file_name);
        file_path.set_extension("svg");
        fs::write(file_path, svg).expect("File succesfully written.");
        count += 1;
    }
}
