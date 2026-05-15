# Machine Learning for Engineering Course Project

## Note from the Author

This project was from a graduate level machine learning engineering course. It was very fun which is why it is here. I used some of my own data from my hygrothermal work. See published results tab. Although simple in nature, this project handles machine learning and aims to explain the results with respect to the physical nature of the data.



# Final Project: Predicting Impact and Tensile Performance Degradation from Water Saturation on Short Fiber Reinforced 3D Printed Polymer Filaments

**Name:** Isaac Sluder\
**Course:** Machine Learning for Engineering\
**Date:** 2025-12-01

## Problem Description

This project investigates the effect of humidity conditioning on the
mechanical properties (Tensile and Impact) of 3D printed materials
(Onyx, Paht, Nylon). The goal is to use machine learning to predict
mechanical performance based on conditioning parameters and to classify
material types based on test results.



    import numpy as np
    import pandas as pd
    import seaborn as sns
    import matplotlib.pyplot as plt
    %matplotlib inline

    from sklearn.metrics import r2_score, mean_squared_error
    from sklearn.linear_model import LinearRegression
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import MinMaxScaler



## Data Collection

The data used in this study was collected from experimental tensile and
impact tests. The dataset includes features such as Water Content,
Modulus of Elasticity, and Energy Absorption. Below is a summary from
the methods section of the Journal paper I am currently writing. It
details how the experiment was performed. The data used in this Jupyter
notebook was compiled from manually collected mass data (conditioning),
and scripts to collect data points from the mechanical tests (tensile
and impact testing).

### Materials and 3D Printing

The study investigated three materials: Onyx (a PA6-based copolymer with
short chopped carbon fibers), Paht-CF (a PA12 copolymer), and a baseline
Markforged Nylon (same PA6 as Onyx). Specimens for tensile (ASTM D638
Type I) and impact (ASTM D256) tests were fabricated using two different
Fused Filament Fabrication (FFF) systems. Onyx and Nylon were printed on
a Markforged Mark II, while Paht-CF was printed on a Bambu Lab X1C. A
\"systems-level\" approach was adopted, using the manufacturer\'s
default optimized settings for each printer-material combination to
assess the performance of each proprietary ecosystem. Key parameters
like layer height (0.125 mm), infill (100% rectilinear), and wall loops
(2) were kept constant, while nozzle temperature, bed temperature, and
print speed varied between the systems.

### Drying and Conditioning

Before conditioning, all specimens were dried in an environmental
chamber to establish a baseline mass. Onyx and Nylon were dried at 60°C,
while Paht-CF required a higher temperature of 80°C to achieve
significant weight reduction. After drying, a control group of specimens
was set aside for testing. The remaining specimens were conditioned in
the chamber at 60°C and near 100% RH, with their mass measured
periodically over 400 hours until saturation was reached. A separate
experiment was conducted at 60°C and 50% RH for comparison. The water
weight gain (\$M_t=\\frac{m_f-m_i}{m_i}\$) was calculated as the
fractional change in mass. The apparent linear Fickian Diffusion
Coefficient (\$D_x=\\pi\\left(\\frac{h}{4\\
M\_\\infty}\\right)\^2\\left(\\frac{M_t}{\\sqrt t}\\right)\^2\$) was
determined from the initial sorption phase of the mass-time curve to
quantify the rate of moisture absorption.

### Mechanical Testing

All mechanical tests were conducted under ambient lab conditions (22°C,
15-60% RH), with specimens tested within five minutes of being removed
from their controlled storage (desiccator for dry, environmental chamber
for conditioned) to minimize moisture change. Tensile testing was
performed on an Instron 5582 machine following ASTM D638 at a crosshead
speed of 10 mm/min. Impact testing was conducted on an Instron 9350
machine according to ASTM D256, using a 22 kN load cell tup to deliver
an impact energy of 2.7 J. Following the tests, fracture sites were
analyzed using a Keyence VHX-7000 microscope to observe damage
mechanisms.

**Data Preprocessing:**

-   Loaded data from CSV.
-   Handled missing or negative values (e.g., setting negative Water
    Content to 0).
-   Encoded categorical variables (e.g., Conditioning: Dried, 50RH,
    100RH).
-   Split data into Tensile (`df_T`) and Impact (`df_I`) datasets.



### Loading Data from .csv file.



    df = pd.read_csv('/Users/isluder/Library/CloudStorage/OneDrive-TheUniversityofAkron/0_Grad_School/0_1_PHD_Research/0_2_MTHP_Monitor_2025/HUMIDITY_DATA/Phase_I_April_25/Sample_Matrix_T_I_3.csv')
    df
    #Rename 'Lowest_MassCal_Ratio' to 'Estimated_Void_Content' and substract from 1
    df = df.rename(columns={'Lowest_MassCal_Ratio': 'Estimated_Void_Content'})
    df['Estimated_Void_Content'] = 1 - df['Estimated_Void_Content']

    # Drop rows with "O_60C_100RH_WEATHERED" in the "TEST_NAME" column, This is not included in our analysis
    df = df[df['TEST_NAME'] != 'O_60C_100RH_WEATHERED']



To prep our dataframe for machine learning, we can do some data
engineering.

Initially, the \"Water_Cont\" column also included the amount of water
desorbed after drying. This is changed to zero here to reflect the exact
amount of water in the material.

Then, a column was added to to designate the amount of condition for
each sample.

Also, to include the type of material is a difficult task in machine
learning, if we tried to encode the materials as 1, 2, and 3, the model
may get a false sense that there is a hierarchy between the materials,
which is false. A popular technique is called one-hot encoding. It
creates a column for each material and desigates a 1 if it is that
material or a 0 if it is not.

And lastly, we will drop columns that do not matter to us, like the
individual sample names, the batch and serial number, and the date
printed, test_temp, test_humid, and test name



    # if 'Water_Cont' is < 0 set to 0
    df.loc[df['Water_Cont'] < 0, 'Water_Cont'] = 0

    # if 'Cond_DeCond' is 100RH set to 1, if its 50RH set to 0.5 and else 0
    df['Cond_DeCond'] = df['Cond_DeCond'].apply(lambda x: 1 if x == '100RH' else 0.5 if x == '50RH' else 0)

    # One hot encoding the material type into 3 columns, 
    # [['O', 'NW', 'P']
    # [0, 1, 0]
    # [1, 0, 0]
    # [0, 0, 1]]

    df['Onyx'] = df['Material'].apply(lambda x: 1 if x == 'O' else 0)
    df['Nylon_White'] = df['Material'].apply(lambda x: 1 if x == 'NW' else 0)
    df['Paht'] = df['Material'].apply(lambda x: 1 if x == 'P' else 0)

    # Drop columns that are not needed for analysis
    df = df.drop(columns=['Name', 'Batch', 'SN', 'Test_Length', 'Date_Printed', 'Test_Temp', 'Test_Humid', 'TEST_NAME'])
    df




<div>

         Type   Material   Lowest_M   At_Test_M   Water_Cont   SurfaceAreaCalc   VolumeCalc   Density   SAoV       VoSA       \...   Yield Stress   Ultimate Stress   Ultimate Strain   I Max Force   Max Force Time   Final Velocity   I Energy Absorption   Onyx   Nylon_White   Paht
  ------ ------ ---------- ---------- ----------- ------------ ----------------- ------------ --------- ---------- ---------- ------ -------------- ----------------- ----------------- ------------- ---------------- ---------------- --------------------- ------ ------------- ------
  8      T      O          10.979     11.215      0.000000     6722.886          10492.727    1.20      0.640719   1.560747   \...   13.948077      39.278846         0.397549          NaN           NaN              NaN              NaN                   1      0             0
  9      T      O          10.922     11.181      0.000000     6722.886          10492.727    1.20      0.640719   1.560747   \...   23.557692      40.805769         0.367784          NaN           NaN              NaN              NaN                   1      0             0
  10     T      O          10.780     11.047      0.000000     6722.886          10492.727    1.20      0.640719   1.560747   \...   23.776923      40.884615         0.337725          NaN           NaN              NaN              NaN                   1      0             0
  11     T      O          10.926     11.193      0.000000     6722.886          10492.727    1.20      0.640719   1.560747   \...   23.457692      42.123077         0.352112          NaN           NaN              NaN              NaN                   1      0             0
  12     T      O          10.868     11.136      0.000000     6722.886          10492.727    1.20      0.640719   1.560747   \...   23.190385      41.594231         0.358486          NaN           NaN              NaN              NaN                   1      0             0
  \...   \...   \...       \...       \...        \...         \...              \...         \...      \...       \...       \...   \...           \...              \...              \...          \...             \...             \...                  \...   \...          \...
  93     I      P          5.201      5.231       0.576812     2650.369          4765.879     1.06      0.556113   1.798195   \...   NaN            NaN               NaN               209.780       3.108            1.148849         1.051337              0      0             1
  94     I      P          5.238      5.270       0.610920     2650.369          4765.879     1.06      0.556113   1.798195   \...   NaN            NaN               NaN               225.482       3.499            1.174203         0.983743              0      0             1
  95     I      P          5.227      5.261       0.650469     2650.369          4765.879     1.06      0.556113   1.798195   \...   NaN            NaN               NaN               211.135       4.222            1.078530         1.231250              0      0             1
  96     I      P          5.233      5.269       0.687942     2650.369          4765.879     1.06      0.556113   1.798195   \...   NaN            NaN               NaN               214.016       3.512            1.104839         1.159558              0      0             1
  97     I      P          5.239      5.274       0.668066     2650.369          4765.879     1.06      0.556113   1.798195   \...   NaN            NaN               NaN               213.395       3.464            1.126158         1.102595              0      0             1

90 rows × 25 columns

</div>



### Split the data up into Tensile tests.

Lastly, we must split up our dataset into tensile and impact tests,
because they have different columns.

(Note: Impact will be split off from the main dataframe later)



    df_T = df[df['Type'] == 'T']
    df_T = df_T.drop(columns=['Type', 'I Max Force', 'Max Force Time', 'Final Velocity', 'I Energy Absorption'])
    # df_T



For a preview, Let\'s take a look at what conditioning does to our
Modulus of Elasticity



    sns.relplot(data=df_T, x='Water_Cont', y='Mod of Elast', hue='Material', style='Cond_DeCond', s=100, height=6, aspect=1.5)
    plt.ylabel('Modulus of Elasticity (MPa)')
    plt.title('Modulus of Elasticity vs Water Content for Tensile Samples')
    plt.xlabel('Water Content (%)')
    plt.ylim(0, None)
    plt.grid(True)
    plt.show()



![No description has been provided for this
image](attachments/de80a6be08755e7491c5701f969526249f5a01ff.png)



This is generally what happens when we condition 3D printed
thermoplastics such as our Nylons here. Note that the colors correspond
to the material types. In this case Blue stands for Onyx (O in the
graph) which is the short chopped carbon fiber reinforced (cCF)
polyamide 6 polyamide copolymer. Nylon white (NW in the graph) is the
same copolymer but without carbon fibers. While Paht (P in the graph) is
the cCF reinforced PA12 polyamide copolymer.



Next, to view how each variable relates to one another, we can create a
pair plot. This pits each variable against every other variable and
plots it. This shows us the relationships. Each diagonal entry features
a KDE plot, providing a continuous density estimate to visualize the
distribution of that variable.



    df_T_pair_plt = df_T.copy().drop(columns=['At_Test_M', 'MassCal', 'VoSA', 'SAoV', 'VolumeCalc', 'SurfaceAreaCalc', 'Density'])
    df_T_pair_plt.columns




    Index(['Material', 'Lowest_M', 'Water_Cont', 'Estimated_Void_Content',
           'Cond_DeCond', 'T Energy Absorption', 'Mod of Elast', 'Yield Stress',
           'Ultimate Stress', 'Ultimate Strain', 'Onyx', 'Nylon_White', 'Paht'],
          dtype='object')



    # Create a combined column for Material and Cond_DeCond
    df_T_pair_plt['Material_Cond'] = df_T_pair_plt['Material'] + '_' + df_T_pair_plt['Cond_DeCond'].astype(str)

    # Update color_map to use the combined key
    color_map = {
        "O_0.0": "#0d4d7a",
        "O_0.5": "#1f77b4",
        "O_1.0": "#aec7e8",
        "P_0.0": "#8b0000",
        "P_0.5": "#d62728",
        "P_1.0": "#ff9896",
        "NW_0.0": "#006400",
        "NW_0.5": "#2ca02c",
        "NW_1.0": "#98df8a",
    }


    # Apply the color column (optional, but kept for reference)
    df_T_pair_plt['color'] = df_T_pair_plt['Material_Cond'].map(color_map)

    # Now use the combined hue in pairplot with the palette dict
    sns.pairplot(df_T_pair_plt, hue='Material_Cond', diag_kind='kde', height=2.5, palette=color_map)




    <seaborn.axisgrid.PairGrid at 0x15868b100>


![No description has been provided for this
image](attachments/2e8d2c3d430ca9453b1e2547cf6fe4e6b920f9d0.png)



This pair-plot has many variables on it and is very hard to see. A
correlation matrix is a better variant of this type of plot.



    # Create a correlation heatmap
    corr = df_T_pair_plt.select_dtypes(include=[np.number]).corr()
    sns.heatmap(corr, annot=True, cmap='coolwarm')
    column_names = ['Mass', "Water Percent", "Void % (Density)", "Conditioning", "Energy Absorption", "Modulus of Elasticity", "Yield Stress", "Ultimate Stress", "Ultimate Strain", "O", "NW", "P"]
    plt.xticks(ticks=np.arange(len(column_names)) + 0.5, labels=column_names, rotation=45, ha="right")
    plt.yticks(ticks=np.arange(len(column_names)) + 0.5, labels=column_names, rotation=0)
    plt.gcf().set_size_inches(10, 8)
    plt.title('Correlation Heatmap')
    plt.show()



![No description has been provided for this
image](attachments/16298638412c03d7337125441a4343a08e99fc07.png)



A correlation matrix shows us what variables are correlated with each
other. Down the diagonal, the variables match up, so they have perfect
positive correlation at 1. Values close to zero have little correlation,
while values closer to 1 or -1 have higher positive or negative
correlation. They help us view how the data set relates to each other.
For example, voids are negatively correlated with mass, this is because
more mass, means less voids typically. Also, Voids are highly (negative)
correlated with the Material Paht, this is because that material
specificially had less voids than the other two materials. Also,
ultimate strain and energy absorption are highly correlated. This is
inherent to the way energy absorption is calculated. Energy is typically
calculated as work done or the integral of force times the distance
(area under the curve). If our curve is longer (which is directly
related to strain), then we have more energy. This correlation is very
high at 0.98.

These types of charts could be talked about for a long time. They are
also helpful for explaining machine learning trends after training. This
chart may or may not be useful in explaining our machine learning model
later on.



### Split the data up into Impact Tests

In this section we will get the Impact data from our original dataframe.



    df_I = df[df['Type'] == 'I']
    df_I = df_I.drop(columns=['Type', 'T Energy Absorption', 'Mod of Elast', 'Yield Stress', 'Ultimate Stress', 'Ultimate Strain'])



Because of how large the image was, we can skip the pair plot for the
impact (comment it out), and just view the correlation matrix.



    df_I_pair_plt = df_I.copy().drop(columns=['Material', 'At_Test_M', 'SurfaceAreaCalc', 'VolumeCalc', 'Density', 'SAoV', 'VoSA', 'MassCal'])



And here is the correlation matrix.



    # Create a correlation heatmap
    corr = df_I_pair_plt.select_dtypes(include=[np.number]).corr()
    sns.heatmap(corr, annot=True, cmap='coolwarm')
    column_names = ['Mass', "Water Percent", "Void % (Density)", "Conditioning", "Maximum Force", "Maximum Force Time", "Final Velocity", "Energy Absorption", "O", "NW", "P"]
    plt.xticks(ticks=np.arange(len(column_names)) + 0.5, labels=column_names, rotation=45, ha="right")
    plt.yticks(ticks=np.arange(len(column_names)) + 0.5, labels=column_names, rotation=0)
    plt.gcf().set_size_inches(10, 8)
    plt.title('Correlation Heatmap')
    plt.show()



![No description has been provided for this
image](attachments/0ecc34ef45044b8869ad39513146acbe9b591037.png)



## Linear Regression Model and Discussion

For our small continuous dataset, I decided to first utilize a smaller
traditional machine learning model to predict the continous values.
First, we are going to use Linear Regression on the Tensile data. We
need to drop some of the descriptive columns from our pair plot
dataframe.



    df_T_pair_plt.drop(columns=['Material', 'Material_Cond', 'color'], inplace=True)



First let\'s try to predict one tensile feature at a time, then, we can
predict all the tensile test features at the same time.

Let\'s try out Energy Absorption first:



    # Our Features that we will use to predict T Energy Absorption
    features = ['Lowest_M', 'Water_Cont', 'Estimated_Void_Content', 'Cond_DeCond', 'Onyx', 'Nylon_White', 'Paht']

    # Here is the full target list for later.
    # target = ['T Energy Absorption', 'Mod of Elast', 'Yield Stress', 'Ultimate Stress', 'Ultimate Strain',]
    target = ['T Energy Absorption']
    X = df_T_pair_plt[features]
    y = df_T_pair_plt[target]

    # Our sample set is so small that we will train and test on the full dataset
    # Thus our test_train_split is commented out.
    # X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.8, random_state=42)

    model = LinearRegression()
    model.fit(X, y)
    predictions = model.predict(X)

    # Calculate R^2
    r2 = r2_score(y, predictions)

    # Plot predicted vs actual
    plt.scatter(y, predictions)
    plt.plot([y.min(), y.max()], [y.min(), y.max()], 'k--', lw=2)
    plt.xlabel('Actual Tensile Energy Absorption, J')
    plt.ylabel(f'Predicted Tensile Energy Absorption, J')
    plt.title(f'Predicted vs Actual Tensile Energy Absorption (R^2 = {r2:.2f})')
    plt.show()



![No description has been provided for this
image](attachments/5436ad71f46d2575f9072448df99a0cb3c82f93e.png)



This is pretty bad. But this makes a lot of sense. Our dataset spans 3
different material types. One of our materials Nylon White, is extremely
ductile, and can continue to stretch over a long time. The tensile test
for our Composite specimens Onyx and Paht took roughly 2-5 minutes to
run. However, our plain Nylon White under 100% RH conditioning, took 45
minutes for it to run. Over that period, the specimens experience
strains over 600% before breaking. Fiber typically make the material
more brittle, and thus stiffer. This ductile to brittle dichotomy is a
common feature of our study.



If we just removed those Nylon samples our accuracy can go up.



    # Remove 'N' nylon sample rows from df_T_pair_plt
    df_T_pair_plt_woNylon = df_T_pair_plt[df_T_pair_plt['Nylon_White'] != 1]

    # Our Features that we will use to predict T Energy Absorption
    features = ['Lowest_M', 'Water_Cont', 'Estimated_Void_Content', 'Cond_DeCond', 'Onyx', 'Paht']

    # Here is the full target list for later.
    # target = ['T Energy Absorption', 'Mod of Elast', 'Yield Stress', 'Ultimate Stress', 'Ultimate Strain',]
    target = ['T Energy Absorption']
    X = df_T_pair_plt_woNylon[features]
    y = df_T_pair_plt_woNylon[target]

    model = LinearRegression()
    model.fit(X, y)
    predictions = model.predict(X)

    # Calculate R^2
    r2 = r2_score(y, predictions)

    # Plot predicted vs actual
    plt.scatter(y, predictions)
    plt.plot([y.min(), y.max()], [y.min(), y.max()], 'k--', lw=2)
    plt.xlabel('Actual Tensile Energy Absorption, J')
    plt.ylabel(f'Predicted Tensile Energy Absorption, J')
    plt.title(f'Predicted vs Actual Tensile Energy Absorption (w/o Nylon) (R^2 = {r2:.2f})')
    plt.show()



![No description has been provided for this
image](attachments/9953ac9eac0a5bce46ba2abbec49b6dd537cd9b1.png)



By removing our Non-Composite, we get better predictions! But this
isn\'t very novel, as our paht samples will just be higher than our Onyx
samples.

Let\'s try a different variable to predict, ultimate stress.



    # Our Features that we will use to predict T Energy Absorption
    features = ['Lowest_M', 'Water_Cont', 'Estimated_Void_Content', 'Cond_DeCond', 'Onyx', 'Nylon_White', 'Paht']

    # Here is the full target list for later.
    # target = ['T Energy Absorption', 'Mod of Elast', 'Yield Stress', 'Ultimate Stress', 'Ultimate Strain',]
    target = ['Ultimate Stress']
    X = df_T_pair_plt[features]
    y = df_T_pair_plt[target]

    model = LinearRegression()
    model.fit(X, y)
    predictions = model.predict(X)

    # Calculate R^2
    r2 = r2_score(y, predictions)
    # print(f"R^2: {r2}")

    # Plot predicted vs actual
    plt.scatter(y, predictions)
    plt.plot([y.min(), y.max()], [y.min(), y.max()], 'k--', lw=2)
    plt.xlabel('Actual Ultimate Stress, MPa')
    plt.ylabel(f'Predicted Ultimate Stress, MPa')
    plt.title(f'Predicted vs Actual Ultimate Stress (R^2 = {r2:.2f})')
    plt.show()



![No description has been provided for this
image](attachments/1d308a36c020ec801eae8c0048353610329f8b5d.png)



This prediction goes really well, we get a good spread of the data.
There are many factors that will influence the Ultimate Stress, but
generally, as the Water Content increases we will get less Ultimate
Stress. Next, let\'s try to predict all the values. In this case, we
will individually plot each feature.



    # Our Features that we will use to predict
    features = ['Lowest_M', 'Water_Cont', 'Estimated_Void_Content', 'Cond_DeCond', 'Onyx', 'Nylon_White', 'Paht']

    # Here is the full target list for later.
    tensile_target = ['T Energy Absorption', 'Mod of Elast', 'Yield Stress', 'Ultimate Stress', 'Ultimate Strain',]
    X_T = df_T_pair_plt[features]
    y_T = df_T_pair_plt[tensile_target]

    model = LinearRegression()
    model.fit(X_T, y_T)
    predictions = model.predict(X_T)
    # print("MSE:", mean_squared_error(y_T, predictions, multioutput='raw_values'))

    # Calculate R^2
    r2 = r2_score(y_T, predictions, multioutput='raw_values')
    # print(f"R^2: {r2}")

    # Plot predicted vs actual for each target feature
    fig, axes = plt.subplots(1, 5, figsize=(15, 3))
    fig.suptitle('Predicted vs Actual for All Tensile Features', fontsize=16)

    for idx, feature in enumerate(tensile_target):
        ax = axes[idx]
        r2_feature = r2_score(y_T[feature], predictions[:, idx])
        
        ax.scatter(y_T[feature], predictions[:, idx], alpha=0.6)
        ax.plot([y_T[feature].min(), y_T[feature].max()], [y_T[feature].min(), y_T[feature].max()], 'k--', lw=2)
        ax.set_xlabel('Actual')
        ax.set_ylabel('Predicted')
        ax.set_title(f'{feature} (R² = {r2_feature:.2f})')
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()



![No description has been provided for this
image](attachments/1857ca278eef85df8da0c6476422a7fe0672f0c0.png)



This shows a really good trend and showcases the ability of linear
regression to adapt to multiple outputs. Tensile tests also are
typically controlled better, and the speed at which the test strains the
material is very slow. This typically results in more consistent testing
results. Let\'s analyze feature importance.



    # Feature importance from Linear Regression coefficients
    # Get coefficients for each target variable
    coefficients = model.coef_  # Shape: (5, 7) - 5 targets, 7 features

    # Create a DataFrame for better visualization
    feature_importance_df = pd.DataFrame(
        coefficients.T,
        columns=tensile_target,
        index=features
    )

    # print("Feature Coefficients (Importance):")
    # print(feature_importance_df)

    # Plot feature importance for each target
    fig, axes = plt.subplots(1, 5, figsize=(18, 4))
    fig.suptitle('Feature Importance by Target Variable', fontsize=16)

    for idx, target in enumerate(tensile_target):
        ax = axes[idx]
        importances = feature_importance_df[target].abs().sort_values(ascending=True)
        
        colors = ['green' if feature_importance_df[target][feat] > 0 else 'red' for feat in importances.index]
        ax.barh(range(len(importances)), importances.values, color=colors, alpha=0.7)
        ax.set_yticks(range(len(importances)))
        ax.set_yticklabels(importances.index)
        ax.set_xlabel('|Coefficient|')
        ax.set_title(f'{target}')
        ax.grid(True, alpha=0.3, axis='x')

    plt.tight_layout()
    plt.show()

    # Summary: Average absolute importance across all targets
    avg_importance = feature_importance_df.abs().mean(axis=1).sort_values(ascending=False)
    # print("\nAverage Feature Importance (Absolute):")
    # print(avg_importance)



![No description has been provided for this
image](attachments/be82f88cda2b48c17686039f06247dcd4ce53a3c.png)



Feature importance here reveals something very interesting. For all of
our target values, the feature that impacts the prediction the most is
the Estimated Void Content. This does make a lot of sense. Voids are
terrible for 3D printed materials. They do several things, first, they
act as crack initiation sites when under load. Second, they increase
stress in the material (by way of material removal). And for moisture
absorption, they increase the materials ability to absorb moisture. Even
though our Void Percentage is an estimation. It is considered one of our
most important features. For more information on how voids affect 3D
printed materials see source \[1\].

Let\'s try removing the estimated void content.



    # Our Features that we will use to predict, remove estimated void content
    features = ['Lowest_M', 'Water_Cont', 'Cond_DeCond', 'Onyx', 'Nylon_White', 'Paht']

    # Here is the full target list for later.
    tensile_target = ['T Energy Absorption', 'Mod of Elast', 'Yield Stress', 'Ultimate Stress', 'Ultimate Strain',]
    X_T = df_T_pair_plt[features]
    y_T = df_T_pair_plt[tensile_target]

    model = LinearRegression()
    model.fit(X_T, y_T)
    predictions = model.predict(X_T)

    # Plot predicted vs actual for each target feature
    fig, axes = plt.subplots(1, 5, figsize=(15, 3))
    fig.suptitle('Predicted vs Actual for All Tensile Features', fontsize=16)

    for idx, feature in enumerate(tensile_target):
        ax = axes[idx]
        r2_feature = r2_score(y_T[feature], predictions[:, idx])
        
        ax.scatter(y_T[feature], predictions[:, idx], alpha=0.6)
        ax.plot([y_T[feature].min(), y_T[feature].max()], [y_T[feature].min(), y_T[feature].max()], 'k--', lw=2)
        ax.set_xlabel('Actual')
        ax.set_ylabel('Predicted')
        ax.set_title(f'{feature} (R² = {r2_feature:.2f})')
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

    # Feature importance from Linear Regression coefficients
    # Get coefficients for each target variable
    coefficients = model.coef_  # Shape: (5, 7) - 5 targets, 7 features

    # Create a DataFrame for better visualization
    feature_importance_df = pd.DataFrame(
        coefficients.T,
        columns=tensile_target,
        index=features
    )

    # Plot feature importance for each target
    fig, axes = plt.subplots(1, 5, figsize=(18, 4))
    fig.suptitle('Feature Importance by Target Variable', fontsize=16)

    for idx, target in enumerate(tensile_target):
        ax = axes[idx]
        importances = feature_importance_df[target].abs().sort_values(ascending=True)
        
        colors = ['green' if feature_importance_df[target][feat] > 0 else 'red' for feat in importances.index]
        ax.barh(range(len(importances)), importances.values, color=colors, alpha=0.7)
        ax.set_yticks(range(len(importances)))
        ax.set_yticklabels(importances.index)
        ax.set_xlabel('|Coefficient|')
        ax.set_title(f'{target}')
        ax.grid(True, alpha=0.3, axis='x')

    plt.tight_layout()
    plt.show()



![No description has been provided for this
image](attachments/9cd2cac951d9305d3c7851075a7fe512d59dcebe.png)


![No description has been provided for this
image](attachments/d0b83249efc4f81ebe276ebd885e8b6e8d766b75.png)



Very interesting, when we remove the estimated void content our accuracy
overall only decreases by about 1 percent per category, but we get a
much better view of what features the model secondarily considers most
important.

For our energy absorption and ultimate strain, the \"Nylon_White\"
category is the most important (and its a positive importance). This
makes sense because the Nylon White samples had the highest ductility of
all the material and stretched the most. The strictly stiffness and
strength properties are governed by the category of conditioned or not
conditioned. Remember that the this category was created on by these
parameters: conditioned at 100% RH was set to 1, conditioned at 50% RH
was set to 0.5 and our non-conditioned specimens (e.g. the dried
specimens) were set to 0. Intentionally, showing the environment the
samples were aged in. Putting polyamide samples inside of an environment
with high humidity has been known to cause significant degredation. See
sources \[2-4\].



Impact results are very different from tensile but just as interesting.
During the impact test the speed and energy at impact can be controlled,
but the way the material behaves during impact can result in a larger
variation of the data. This makes the data harder to use for predictions
usually resulting in a lower score. Below we try to predict the impact
features based on the same inputs from earlier.



    # Our Features that we will use to predict
    features = ['Lowest_M', 'Water_Cont', 'Estimated_Void_Content', 'Cond_DeCond', 'Onyx', 'Nylon_White', 'Paht']

    # Here is the full target list for later.
    impact_target = ['I Max Force', 'Max Force Time', 'Final Velocity', 'I Energy Absorption']
    X_I = df_I_pair_plt[features]
    y_I = df_I_pair_plt[impact_target]

    model = LinearRegression()
    model.fit(X_I, y_I)
    predictions = model.predict(X_I)

    # Plot predicted vs actual for each target feature
    fig, axes = plt.subplots(1, 4, figsize=(15, 3))
    fig.suptitle('Predicted vs Actual for All Impact Features', fontsize=16)

    for idx, feature in enumerate(impact_target):
        ax = axes[idx]
        r2_feature = r2_score(y_I[feature], predictions[:, idx])
        
        ax.scatter(y_I[feature], predictions[:, idx], alpha=0.6)
        ax.plot([y_I[feature].min(), y_I[feature].max()], [y_I[feature].min(), y_I[feature].max()], 'k--', lw=2)
        ax.set_xlabel('Actual')
        ax.set_ylabel('Predicted')
        ax.set_title(f'{feature} (R² = {r2_feature:.2f})')
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()



![No description has been provided for this
image](attachments/e20f2d2b86add49658b1cea4413fe0ec9fd7590b.png)



We actually get very good performance for two of our features; maximum
impact force and time. But the other two features have a lower
prediction ability. The final velocity has so much variation in the data
its no wonder the model has issues predicting it. However, the energy
absorption seem like it should have a higher prediction but the
variation is still high. Let\'s take a look at the feature importance.



    # Feature importance from Linear Regression coefficients
    # Get coefficients for each target variable
    coefficients = model.coef_  # Shape: (5, 7) - 5 targets, 7 features

    # Create a DataFrame for better visualization
    feature_importance_df = pd.DataFrame(
        coefficients.T,
        columns=impact_target,
        index=features
    )

    # Plot feature importance for each target
    fig, axes = plt.subplots(1, 4, figsize=(18, 4))
    fig.suptitle('Feature Importance by Target Variable', fontsize=16)
     
    for idx, target in enumerate(impact_target):
        ax = axes[idx]
        importances = feature_importance_df[target].abs().sort_values(ascending=True)
        
        colors = ['green' if feature_importance_df[target][feat] > 0 else 'red' for feat in importances.index]
        ax.barh(range(len(importances)), importances.values, color=colors, alpha=0.7)
        ax.set_yticks(range(len(importances)))
        ax.set_yticklabels(importances.index)
        ax.set_xlabel('|Coefficient|')
        ax.set_title(f'{target}')
        ax.grid(True, alpha=0.3, axis='x')

    plt.tight_layout()
    plt.show()



![No description has been provided for this
image](attachments/cbd5d661f66c04f4886157ff7996a083b8ea4df6.png)



Similarly as before we see that the void content is just as high as
before, for the same reasons as stated before. If we remove the void
content, let\'s see what this reveals.



    # Our Features that we will use to predict, removed estimated void content
    features = ['Lowest_M', 'Water_Cont', 'Cond_DeCond', 'Onyx', 'Nylon_White', 'Paht']
    impact_target = ['I Max Force', 'Max Force Time', 'Final Velocity', 'I Energy Absorption']
    X_I = df_I_pair_plt[features]
    y_I = df_I_pair_plt[impact_target]

    model = LinearRegression()
    model.fit(X_I, y_I)
    predictions = model.predict(X_I)

    # Plot predicted vs actual for each target feature
    fig, axes = plt.subplots(1, 4, figsize=(15, 3))
    fig.suptitle('Predicted vs Actual for All Impact Features', fontsize=16)

    for idx, feature in enumerate(impact_target):
        ax = axes[idx]
        r2_feature = r2_score(y_I[feature], predictions[:, idx])
        
        ax.scatter(y_I[feature], predictions[:, idx], alpha=0.6)
        ax.plot([y_I[feature].min(), y_I[feature].max()], [y_I[feature].min(), y_I[feature].max()], 'k--', lw=2)
        ax.set_xlabel('Actual')
        ax.set_ylabel('Predicted')
        ax.set_title(f'{feature} (R² = {r2_feature:.2f})')
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

    # Feature importance from Linear Regression coefficients
    # Get coefficients for each target variable
    coefficients = model.coef_  # Shape: (5, 7) - 5 targets, 7 features

    # Create a DataFrame for better visualization
    feature_importance_df = pd.DataFrame(
        coefficients.T,
        columns=impact_target,
        index=features
    )

    # Plot feature importance for each target
    fig, axes = plt.subplots(1, 4, figsize=(18, 4))
    fig.suptitle('Feature Importance by Target Variable', fontsize=16)
     
    for idx, target in enumerate(impact_target):
        ax = axes[idx]
        importances = feature_importance_df[target].abs().sort_values(ascending=True)
        
        colors = ['green' if feature_importance_df[target][feat] > 0 else 'red' for feat in importances.index]
        ax.barh(range(len(importances)), importances.values, color=colors, alpha=0.7)
        ax.set_yticks(range(len(importances)))
        ax.set_yticklabels(importances.index)
        ax.set_xlabel('|Coefficient|')
        ax.set_title(f'{target}')
        ax.grid(True, alpha=0.3, axis='x')

    plt.tight_layout()
    plt.show()



![No description has been provided for this
image](attachments/cabaf8b9d60f57093b838436c53a6e1b2f303f56.png)


![No description has been provided for this
image](attachments/540e73da83b1ea3d357b3b7fc5c629467e6ae761.png)



Prediction values for final velocity and energy absorption do not change
at all, but the feature importance has changed. The conditioned category
moves up top to negatively impact the final velocity prediction and
positively affect the energy absorption. This is because of the way the
material experience the degredation from moisture. Moisture reduces our
polyamide materials ability to resist strain and force. While this tends
to increase energy absorption, the decreases its ability to slow down
the impactor. The max force and max force time are highly material
dependent. The lowest mass category represents the lowest recorded mass
(after drying) of a coupon. Typically, our PA12 materials were much
heavier than the PA6 materials. Our PA12 material were also much
stronger, this results in a materials dependent scenario. The PA12
materials also had the least moisture absorption degredation effect, so
as the moisture content increased in the Paht material, the impact
resistance of the material decreased only slightly, making the model
perceive that moisture had less effect that the material (which could be
derived from the mass).



## Conclusion

In this study we subjected three different 3D printed materials Onyx,
Paht, and Nylon to high temp, high humidity conditioning. Then, we
analyzed their mechanical performace by subjecting the coupons to
tensile and Izod impact tests. The stress-strain curves and force-time
curves were collected from the experiments to which we collected
individual features for our machine learning model. Due to the small
size of the dataset, linear regression was chosen as the vessel of
analysis.

Our dataset was split into two parts, the tensile data, and the impact
data. Overall, the tensile data resulted in better predictions due to
the consistency of the dataset (average accuracy of 84% over all
features), while the impact data suffered from higher variations
(average accuracy of 75%). The highest feature importance was void
content, which correlates well with literature and the material type
from the study. Removing void content only resulted in an average of 1%
decrease in accuracy.

In future studies, perhaps the input features could be adjusted to just
material type and the water content. The other features seemed to have a
higher correlation with the material type. Also, no classification of
material or damage type was chosen in this study which could have been
an interesting addition.



## References

1.  Tao Y, Kong F, Li Z, Zhang J, Zhao X, Yin Q, et al. A review on
    voids of 3D printed parts by fused filament fabrication. J Mater Res
    Technol 2021;15:4860--79.
    <https://doi.org/10.1016/j.jmrt.2021.10.108>.
2.  Morales MA, Lawrence BD, Henry TC. Impact of moisture and
    temperature on the flexural properties of 3D-printed carbon
    fiber-reinforced polyamide composites. J Compos Mater
    2025;59:00219983251341620.
    <https://doi.org/10.1177/00219983251341620>.
3.  Hou Y, Panesar A. The moisture absorption of additively manufactured
    short carbon fibre reinforced polyamide. Compos Part Appl Sci Manuf
    2025;188:108528.
    <https://doi.org/10.1016/j.compositesa.2024.108528>.
4.  Wang K, Chen Y, Long H, Baghani M, Rao Y, Peng Y. Hygrothermal aging
    effects on the mechanical properties of 3D printed composites with
    different stacking sequence of continuous glass fiber layers. Polym
    Test 2021;100:107242.
    <https://doi.org/10.1016/j.polymertesting.2021.107242>.
