use splitter::generate_paths;

fn main()  {
    let path = generate_paths("menu").expect("Icon path.");
    println!("Pfad: {path}");
}
