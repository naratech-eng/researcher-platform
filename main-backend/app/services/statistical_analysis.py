"""Statistical analysis service for genetics data.

Provides various statistical analyses including:
- Linear regression
- Multiple regression  
- Random forest
- Q-Q plots
- Correlation analysis
- ANOVA
- And more

Returns both results and copyable code snippets for reproducibility.
"""

from __future__ import annotations

import io
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import plotly.utils
from scipy import stats
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error


def perform_linear_regression(
    data: pd.DataFrame,
    x_column: str,
    y_column: str,
) -> Dict[str, Any]:
    """Perform simple linear regression analysis.
    
    Args:
        data: DataFrame with the data
        x_column: Independent variable column name
        y_column: Dependent variable column name
    
    Returns:
        Dict with results, chart, and code snippet
    """
    # Prepare data
    X = data[[x_column]].values
    y = data[y_column].values
    
    # Fit model
    model = LinearRegression()
    model.fit(X, y)
    y_pred = model.predict(X)
    
    # Calculate metrics
    r2 = r2_score(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    
    # Create scatter plot with regression line
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=data[x_column],
        y=data[y_column],
        mode='markers',
        name='Data points'
    ))
    fig.add_trace(go.Scatter(
        x=data[x_column],
        y=y_pred,
        mode='lines',
        name='Regression line',
        line=dict(color='red')
    ))
    fig.update_layout(
        title=f'Linear Regression: {y_column} vs {x_column}',
        xaxis_title=x_column,
        yaxis_title=y_column,
        hovermode='closest'
    )
    
    # Generate code snippet
    code_snippet = f"""# Linear Regression Analysis
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
import numpy as np

# Prepare data
X = data[['{x_column}']].values
y = data['{y_column}'].values

# Fit model
model = LinearRegression()
model.fit(X, y)
y_pred = model.predict(X)

# Calculate metrics
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))

print(f"R² Score: {{r2:.4f}}")
print(f"RMSE: {{rmse:.4f}}")
print(f"Coefficient: {{model.coef_[0]:.4f}}")
print(f"Intercept: {{model.intercept_:.4f}}")
"""
    
    return {
        "type": "linear_regression",
        "results": {
            "r2_score": float(r2),
            "rmse": float(rmse),
            "coefficient": float(model.coef_[0]),
            "intercept": float(model.intercept_),
            "equation": f"y = {model.coef_[0]:.4f}x + {model.intercept_:.4f}"
        },
        "chart": fig.to_dict(),
        "code_snippet": code_snippet,
    }


def perform_random_forest_analysis(
    data: pd.DataFrame,
    x_columns: List[str],
    y_column: str,
    n_estimators: int = 100,
) -> Dict[str, Any]:
    """Perform random forest regression analysis.
    
    Args:
        data: DataFrame with the data
        x_columns: List of independent variable column names
        y_column: Dependent variable column name
        n_estimators: Number of trees in the forest
    
    Returns:
        Dict with results, feature importance chart, and code snippet
    """
    # Prepare data
    X = data[x_columns].values
    y = data[y_column].values
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Fit model
    model = RandomForestRegressor(n_estimators=n_estimators, random_state=42)
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Calculate metrics
    r2_train = r2_score(y_train, y_pred_train)
    r2_test = r2_score(y_test, y_pred_test)
    rmse_train = np.sqrt(mean_squared_error(y_train, y_pred_train))
    rmse_test = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': x_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    # Create feature importance chart
    fig = px.bar(
        feature_importance,
        x='importance',
        y='feature',
        orientation='h',
        title='Feature Importance (Random Forest)'
    )
    
    # Generate code snippet
    code_snippet = f"""# Random Forest Analysis
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
import numpy as np

# Prepare data
X = data[{x_columns}].values
y = data['{y_column}'].values

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Fit model
model = RandomForestRegressor(n_estimators={n_estimators}, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred_test = model.predict(X_test)
r2 = r2_score(y_test, y_pred_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))

print(f"R² Score (Test): {{r2:.4f}}")
print(f"RMSE (Test): {{rmse:.4f}}")
print("\\nFeature Importance:")
for feat, imp in zip({x_columns}, model.feature_importances_):
    print(f"  {{feat}}: {{imp:.4f}}")
"""
    
    return {
        "type": "random_forest",
        "results": {
            "r2_train": float(r2_train),
            "r2_test": float(r2_test),
            "rmse_train": float(rmse_train),
            "rmse_test": float(rmse_test),
            "feature_importance": feature_importance.to_dict('records'),
        },
        "chart": fig.to_dict(),
        "code_snippet": code_snippet,
    }


def create_qq_plot(
    data: pd.DataFrame,
    column: str,
) -> Dict[str, Any]:
    """Create a Q-Q plot for normality testing.
    
    Args:
        data: DataFrame with the data
        column: Column name to analyze
    
    Returns:
        Dict with Q-Q plot chart and code snippet
    """
    values = data[column].dropna().values
    
    # Generate Q-Q plot data
    (osm, osr), (slope, intercept, r) = stats.probplot(values, dist="norm")
    
    # Create plot
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=osm,
        y=osr,
        mode='markers',
        name='Sample quantiles'
    ))
    fig.add_trace(go.Scatter(
        x=osm,
        y=slope * osm + intercept,
        mode='lines',
        name='Theoretical line',
        line=dict(color='red', dash='dash')
    ))
    fig.update_layout(
        title=f'Q-Q Plot: {column}',
        xaxis_title='Theoretical Quantiles',
        yaxis_title='Sample Quantiles',
        hovermode='closest'
    )
    
    # Shapiro-Wilk test for normality
    shapiro_stat, shapiro_p = stats.shapiro(values[:5000])  # Limit for performance
    
    # Generate code snippet
    code_snippet = f"""# Q-Q Plot for Normality Testing
import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

# Get data
values = data['{column}'].dropna().values

# Create Q-Q plot
fig, ax = plt.subplots()
stats.probplot(values, dist="norm", plot=ax)
ax.set_title('Q-Q Plot: {column}')
plt.show()

# Shapiro-Wilk test for normality
shapiro_stat, shapiro_p = stats.shapiro(values[:5000])
print(f"Shapiro-Wilk Test:")
print(f"  Statistic: {{shapiro_stat:.4f}}")
print(f"  P-value: {{shapiro_p:.4f}}")
if shapiro_p > 0.05:
    print("  Data appears normally distributed (p > 0.05)")
else:
    print("  Data may not be normally distributed (p <= 0.05)")
"""
    
    return {
        "type": "qq_plot",
        "results": {
            "shapiro_wilk_statistic": float(shapiro_stat),
            "shapiro_wilk_p_value": float(shapiro_p),
            "normally_distributed": bool(shapiro_p > 0.05),
        },
        "chart": fig.to_dict(),
        "code_snippet": code_snippet,
    }


def detect_analysis_type(user_question: str) -> Optional[str]:
    """Detect what type of statistical analysis the user is requesting.
    
    Args:
        user_question: The user's question
    
    Returns:
        Analysis type or None
    """
    question_lower = user_question.lower()
    
    if any(kw in question_lower for kw in ["linear regression", "simple regression"]):
        return "linear_regression"
    
    if any(kw in question_lower for kw in ["random forest", "rf regression"]):
        return "random_forest"
    
    if any(kw in question_lower for kw in ["q-q plot", "qq plot", "normality", "normal distribution"]):
        return "qq_plot"
    
    if any(kw in question_lower for kw in ["correlation", "pearson", "spearman"]):
        return "correlation"
    
    return None
