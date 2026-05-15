# Final Report: CompCompData – Composites Experimental Database Application

**Team:** Mechanical Integrators (Isaac Sluder, Andrew Frankowski)

**Date:** May 3rd, 2026

This project was done for a Ph.D. level Database Integration Course. It shows how my colleague and I learned how to use SQLite and impliment it in an application to unite different sources of information from multiple labmates.

## Introduction

The CompCompData application was developed to address a critical bottleneck in our laboratory’s workflow: the reliance on isolated, undocumented Excel spreadsheets for calculating and representing massive experimental datasets. Previously, analyzing a single composites test required manually opening .csv files containing tens to hundreds of thousands of data points, formatting them, and writing custom formulas. Comparing data across multiple experiments—such as juxtaposing Andrew's Recycling Onyx with Isaac's Hygroscopicity data—often caused Excel to freeze and required intricate knowledge of file directory locations.

To solve this, the Mechanical Integrators team built CompCompData. Utilizing a Python backend, a relational SQLite database, and a PyQt6 graphical user interface, this application transitions our data management into a structured, highly reproducible pipeline. By automating the data processing through dynamic extraction algorithms, the project not only makes data analysis exponentially more time-efficient but also prepares our laboratory's data for future machine learning and deep learning applications.

## 1. Data Importation

To replace the manual Excel pipeline, we established a streamlined, code-driven importation process that bridges the gap between raw data collection and database entry. The application is designed to ingest data metadata either individually or via a "Mass Import" Excel log.

Under the hood, the importation engine (`database.py`) features a "Smart Path Resolver" (`resolve_file_info`). Instead of forcing researchers to manually link exact, absolute file paths—which easily break when folders are moved—the user only needs to provide the raw file name. The Python backend crawls the designated external `DATA_SOURCE` directory using `os.walk`, locates the corresponding `.csv` file, and automatically links the absolute path to the database entry. This ensures that the massive raw data files remain safely stored externally, while the database remains lightweight and perfectly mapped.
!(Figure 1)[attachments/Pasted image 20260515141422.png]
Figure 1 - Importing Meta-Data of single test result using Pyqt6 Interface

## 2. Data Integration

Integrating the diverse range of composites research conducted in our lab required a normalized relational database. We built this tracking structure using SQLite, strictly enforcing foreign key constraints to prevent orphan data and duplicate entries.

Our schema categorizes data across four primary levels of integration:

·       **S1 (Entities):** Tracks the `Students` and `Projects`.

·       **S2 (Materials & Methods):** Tracks `PrimaryMaterial`, `SecondaryMaterial`, and uniquely, the `Algorithms` containing the Python logic required to process that specific material/test combination.

·       **S3 (Testing):** Logs the `Tests` conducted (e.g., Tensile, Flexural) and `Fixtures` utilized.

·       **S4 (The Hub):** The central `experimental_data` table that links file paths to all external keys, alongside three dynamic `Pivot Variables` to capture project-specific conditions (like varying impact energies or humidity).

To make this highly normalized data accessible to the GUI, we programmed a SQLite View named `readable_lab_data`. This View automatically performs all necessary operations to flatten the relational data into a highly query-able format without duplicating stored data.
!(Figure 2)[attachments/Pasted image 20260515141643.png]
Figure 2 - Database Schema
!(Figure 3)[attachments/Pasted image 20260515141650.png]
Figure 3 - View of the meta-data with enforced schema (and un-enforced columns)

## 3. Data Processing

The core scientific value of CompCompData lies in its Data Processing architecture. Instead of processing data upon importation, the application utilizes a `graph_data_engine.py` that processes data _on-the-fly_ when a researcher runs a query.

We developed an algorithm registry that maps database string values to actual Python classes (e.g., mapping "TensileExtraction" to `tensile_extraction.py`). When data is queried, Python's `importlib` dynamically loads the appropriate script. These scripts utilize Pandas for dataframe manipulation, NumPy for vector mathematics, and SciPy for scientific computing:

·       **Tensile & Flexural Extraction:** Utilizes `scipy.stats.linregress` to calculate zero-intercept linear regressions on the elastic regions of the stress-strain curves, automatically outputting the Elastic/Flexural Modulus and Ultimate Tensile Strength.

·       **Impact Extraction (Izod & Sandwich):** Employs `scipy.signal.savgol_filter` (Savitzky-Golay filter) to smooth noisy load cell data, allowing the algorithm to accurately identify peak contact forces and integrate the curve for total absorbed energy.

By decoupling the raw data from the math, researchers can tweak extraction parameters (like gauge length or smoothing windows) directly in the UI and instantly re-process the data without altering the original files.
!(Figure 4)[attachments/Pasted image 20260515141703.png]
Figure 4 – Main Software backend showing SQLite (top), Python (bottom left), and QT (bottom right)
!(Figure 5)[attachments/Pasted image 20260515141711.png]
Figure 5 - Unsmoothed (top) vs smoothed (bottom)

## 4. Data Visualization

The frontend graphical user interface (GUI) was designed using the PyQt6 framework, providing a responsive experience. The ultimate goal of integrating and processing this data is to utilize CompCompData to instantly compare experiments.

The "Graphs" tab contains a multi-threaded architecture. When a user executes a query, an `ExtractionWorker` thread runs the Pandas data processing in the background, preventing the UI from freezing. Once processed, the data is handed to the `graph_builder.py` engine, which utilizes Plotly to generate interactive HTML charts displayed natively within the app via `QWebEngineView`.

The "Customize" sub-tab dynamically morphs based on the selected algorithms. If a Bar Chart is selected, it extracts scalar metrics (like Peak Force) and aggregates them (Mean, Median) with automatically calculated standard deviation or standard error bars. If a Line Plot is selected, it intelligently downsamples curves exceeding 1,000 data points while strictly preserving minimum and maximum peak values to ensure the visual fidelity of the failure points is never compromised.
!(Figure 6)[attachments/Pasted image 20260515141718.png]
Figure 6 - Customizing Options, Group by "Material" shown.

!(Figure 7)[attachments/Pasted image 20260515141725.png]
Figure 7 - Barchart displaying error bars and group by material.

## Conclusion

The development of CompCompData marks a significant paradigm shift in how our Advanced Metacomposite Laboratory handles experimental data. By transitioning from fragile, localized Excel spreadsheets to a centralized SQLite database powered by an extensible Python backend, we have eliminated redundant calculations and minimized the risk of human error in data formatting. The intelligent ingestion pipeline, coupled with dynamic, algorithm-driven processing and interactive Plotly visualizations, drastically reduces the time required to derive insights from physical testing. Ultimately, this structured data integration lays the perfect groundwork for future research, ensuring our historical data is clean, accessible, and primed for advanced machine learning analysis.