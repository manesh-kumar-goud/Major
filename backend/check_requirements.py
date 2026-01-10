"""
Check all requirements and verify installations
"""
import sys
import subprocess
import pkg_resources

def check_package(package_name, required_version=None):
    """Check if a package is installed"""
    try:
        if required_version:
            # Check specific version
            pkg_resources.require(f"{package_name}=={required_version}")
            return True, "OK"
        else:
            # Just check if installed
            pkg_resources.require(package_name)
            installed = pkg_resources.get_distribution(package_name)
            return True, installed.version
    except pkg_resources.DistributionNotFound:
        return False, "NOT INSTALLED"
    except pkg_resources.VersionConflict as e:
        installed = pkg_resources.get_distribution(package_name)
        return False, f"Version mismatch: installed={installed.version}, required={required_version}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def parse_requirements():
    """Parse requirements.txt"""
    requirements = {}
    try:
        with open('requirements.txt', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Handle >=, ==, etc.
                    if '>=' in line:
                        parts = line.split('>=')
                        requirements[parts[0].strip()] = f">={parts[1].strip()}"
                    elif '==' in line:
                        parts = line.split('==')
                        requirements[parts[0].strip()] = parts[1].strip()
                    else:
                        requirements[line] = None
    except FileNotFoundError:
        print("❌ requirements.txt not found")
        return {}
    return requirements

print("=" * 70)
print("REQUIREMENTS CHECK - Complete Verification")
print("=" * 70)

# Parse requirements
requirements = parse_requirements()

print(f"\n📦 Found {len(requirements)} packages in requirements.txt\n")

# Check each requirement
results = []
missing = []
version_mismatches = []

for package, version in requirements.items():
    if version:
        is_ok, status = check_package(package, version)
    else:
        is_ok, status = check_package(package)
    
    if is_ok:
        print(f"✅ {package:30} {version or 'any':15} -> {status}")
        results.append(True)
    else:
        if "NOT INSTALLED" in status:
            print(f"❌ {package:30} {version or 'any':15} -> NOT INSTALLED")
            missing.append(package)
            results.append(False)
        else:
            print(f"⚠️  {package:30} {version or 'any':15} -> {status}")
            version_mismatches.append((package, version, status))
            results.append(False)

# Summary
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
passed = sum(results)
total = len(results)
print(f"✅ Installed correctly: {passed}/{total}")
print(f"❌ Missing: {len(missing)}")
print(f"⚠️  Version mismatches: {len(version_mismatches)}")

if missing:
    print(f"\n❌ MISSING PACKAGES ({len(missing)}):")
    for pkg in missing:
        req_version = requirements.get(pkg, 'any')
        print(f"   - {pkg} {req_version}")

if version_mismatches:
    print(f"\n⚠️  VERSION MISMATCHES ({len(version_mismatches)}):")
    for pkg, req_ver, status in version_mismatches:
        print(f"   - {pkg}: required {req_ver}, {status}")

# Critical packages check
print("\n" + "=" * 70)
print("CRITICAL PACKAGES CHECK")
print("=" * 70)

critical = {
    'tensorflow': '2.18.0',
    'keras': '3.3.3',
    'numpy': '2.1.3',
    'fastapi': '0.115.0',
    'uvicorn': '0.32.0',
    'pandas': '2.2.3',
    'scikit-learn': '1.5.2'
}

all_critical_ok = True
for pkg, version in critical.items():
    is_ok, status = check_package(pkg, version)
    if is_ok:
        print(f"✅ {pkg:20} {version:15} -> OK")
    else:
        print(f"❌ {pkg:20} {version:15} -> {status}")
        all_critical_ok = False

print("\n" + "=" * 70)
if all_critical_ok and len(missing) == 0:
    print("✅ ALL REQUIREMENTS MET - Backend ready!")
else:
    print("⚠️  SOME REQUIREMENTS MISSING OR MISMATCHED")
    print("\nTo install missing packages:")
    print("  pip install -r requirements.txt")
    print("\nTo upgrade packages:")
    print("  pip install --upgrade -r requirements.txt")
print("=" * 70)





