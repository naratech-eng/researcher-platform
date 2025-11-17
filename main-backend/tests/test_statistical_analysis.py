"""Tests for statistical analysis service."""

import numpy as np
import pandas as pd
import pytest

from app.services.statistical_analysis import (
    create_qq_plot,
    detect_analysis_type,
    perform_linear_regression,
    perform_random_forest_analysis,
)


def test_detect_linear_regression():
    """Test detection of linear regression intent."""
    assert detect_analysis_type("Perform linear regression on weight vs age") == "linear_regression"
    assert detect_analysis_type("Run a simple regression") == "linear_regression"
    assert detect_analysis_type("some other query") is None


def test_detect_random_forest():
    """Test detection of random forest intent."""
    assert detect_analysis_type("Use random forest to predict traits") == "random_forest"
    assert detect_analysis_type("RF regression analysis") == "random_forest"


def test_detect_qq_plot():
    """Test detection of Q-Q plot intent."""
    assert detect_analysis_type("Create a Q-Q plot for normality") == "qq_plot"
    assert detect_analysis_type("Test normal distribution with qq plot") == "qq_plot"


def test_linear_regression():
    """Test linear regression analysis."""
    # Create sample data
    np.random.seed(42)
    n = 100
    x = np.linspace(0, 10, n)
    y = 2.5 * x + 3 + np.random.normal(0, 2, n)
    
    df = pd.DataFrame({
        'x_var': x,
        'y_var': y,
    })
    
    # Perform analysis
    result = perform_linear_regression(df, 'x_var', 'y_var')
    
    # Verify structure
    assert result['type'] == 'linear_regression'
    assert 'results' in result
    assert 'chart' in result
    assert 'code_snippet' in result
    
    # Verify results
    results = result['results']
    assert 'r2_score' in results
    assert 'rmse' in results
    assert 'coefficient' in results
    assert 'intercept' in results
    assert 'equation' in results
    
    # Verify coefficient is close to 2.5
    assert 2.0 < results['coefficient'] < 3.0
    
    # Verify R² is reasonable
    assert results['r2_score'] > 0.5
    
    # Verify chart structure
    assert isinstance(result['chart'], dict)
    assert 'data' in result['chart']
    assert 'layout' in result['chart']
    
    # Verify code snippet
    assert 'import pandas as pd' in result['code_snippet']
    assert 'LinearRegression' in result['code_snippet']
    assert 'x_var' in result['code_snippet']


def test_random_forest_analysis():
    """Test random forest regression analysis."""
    # Create sample data with multiple features
    np.random.seed(42)
    n = 100
    x1 = np.random.rand(n) * 10
    x2 = np.random.rand(n) * 10
    y = 2 * x1 + 3 * x2 + np.random.normal(0, 1, n)
    
    df = pd.DataFrame({
        'feature1': x1,
        'feature2': x2,
        'target': y,
    })
    
    # Perform analysis
    result = perform_random_forest_analysis(
        df,
        x_columns=['feature1', 'feature2'],
        y_column='target',
        n_estimators=50,
    )
    
    # Verify structure
    assert result['type'] == 'random_forest'
    assert 'results' in result
    assert 'chart' in result
    assert 'code_snippet' in result
    
    # Verify results
    results = result['results']
    assert 'r2_train' in results
    assert 'r2_test' in results
    assert 'rmse_train' in results
    assert 'rmse_test' in results
    assert 'feature_importance' in results
    
    # Verify R² is reasonable
    assert results['r2_train'] > 0.5
    assert results['r2_test'] > 0.3
    
    # Verify feature importance
    assert len(results['feature_importance']) == 2
    assert all('feature' in fi for fi in results['feature_importance'])
    assert all('importance' in fi for fi in results['feature_importance'])
    
    # Verify chart structure
    assert isinstance(result['chart'], dict)
    assert 'data' in result['chart']
    
    # Verify code snippet
    assert 'RandomForestRegressor' in result['code_snippet']
    assert 'feature1' in result['code_snippet']


def test_qq_plot():
    """Test Q-Q plot generation."""
    # Create normally distributed data
    np.random.seed(42)
    data = np.random.normal(100, 15, 1000)
    
    df = pd.DataFrame({
        'values': data,
    })
    
    # Create Q-Q plot
    result = create_qq_plot(df, 'values')
    
    # Verify structure
    assert result['type'] == 'qq_plot'
    assert 'results' in result
    assert 'chart' in result
    assert 'code_snippet' in result
    
    # Verify results
    results = result['results']
    assert 'shapiro_wilk_statistic' in results
    assert 'shapiro_wilk_p_value' in results
    assert 'normally_distributed' in results
    
    # For normally distributed data, p-value should be > 0.05
    assert results['normally_distributed'] == True
    assert results['shapiro_wilk_p_value'] > 0.05
    
    # Verify chart structure
    assert isinstance(result['chart'], dict)
    assert 'data' in result['chart']
    assert 'layout' in result['chart']
    
    # Verify code snippet
    assert 'probplot' in result['code_snippet']
    assert 'shapiro' in result['code_snippet']


def test_qq_plot_non_normal_data():
    """Test Q-Q plot with non-normally distributed data."""
    # Create exponentially distributed data (not normal)
    np.random.seed(42)
    data = np.random.exponential(2, 1000)
    
    df = pd.DataFrame({
        'values': data,
    })
    
    # Create Q-Q plot
    result = create_qq_plot(df, 'values')
    
    # For non-normal data, should detect it
    results = result['results']
    # Exponential distribution should be detected as non-normal
    assert results['normally_distributed'] == False
    assert results['shapiro_wilk_p_value'] < 0.05
