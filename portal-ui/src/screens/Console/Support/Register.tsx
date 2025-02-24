// This file is part of MinIO Console Server
// Copyright (c) 2022 MinIO, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { Fragment, useCallback, useEffect, useState } from "react";
import { Theme } from "@mui/material/styles";
import {
  Button,
  CopyIcon,
  OfflineRegistrationIcon,
  OnlineRegistrationIcon,
  PageHeader,
  UsersIcon,
} from "mds";
import createStyles from "@mui/styles/createStyles";
import {
  actionsTray,
  containerForHeader,
  searchField,
  spacingUtils,
} from "../Common/FormComponents/common/styleLibrary";
import withStyles from "@mui/styles/withStyles";
import { Box, Link } from "@mui/material";
import PageLayout from "../Common/Layout/PageLayout";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import InputBoxWrapper from "../Common/FormComponents/InputBoxWrapper/InputBoxWrapper";
import api from "../../../common/api";

import {
  SubnetInfo,
  SubnetLoginRequest,
  SubnetLoginResponse,
  SubnetLoginWithMFARequest,
  SubnetOrganization,
  SubnetRegisterRequest,
  SubnetRegTokenResponse,
} from "../License/types";
import { ErrorResponseHandler } from "../../../common/types";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SelectWrapper from "../Common/FormComponents/SelectWrapper/SelectWrapper";
import { hasPermission } from "../../../common/SecureComponent";
import {
  CONSOLE_UI_RESOURCE,
  IAM_PAGES,
  IAM_PAGES_PERMISSIONS,
} from "../../../common/SecureComponent/permissions";
import { useSelector } from "react-redux";

import RegisterHelpBox from "./RegisterHelpBox";
import { selOpMode, setErrorSnackMessage } from "../../../systemSlice";
import { useAppDispatch } from "../../../store";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { TabPanel } from "../../shared/tabs";
import { ClusterRegistered, FormTitle, ProxyConfiguration } from "./utils";
import ApiKeyRegister from "./ApiKeyRegister";
import CopyToClipboard from "react-copy-to-clipboard";
import TooltipWrapper from "../Common/TooltipWrapper/TooltipWrapper";

interface IRegister {
  classes: any;
}

const styles = (theme: Theme) =>
  createStyles({
    link: {
      color: "#2781B0",
      cursor: "pointer",
    },
    sizedLabel: {
      minWidth: "75px",
    },
    ...actionsTray,
    ...searchField,
    ...spacingUtils,
    ...containerForHeader(theme.spacing(4)),
  });

const Register = ({ classes }: IRegister) => {
  const dispatch = useAppDispatch();
  const operatorMode = useSelector(selOpMode);
  const [license, setLicense] = useState<string>("");
  const [subnetPassword, setSubnetPassword] = useState<string>("");
  const [subnetEmail, setSubnetEmail] = useState<string>("");
  const [subnetMFAToken, setSubnetMFAToken] = useState<string>("");
  const [subnetOTP, setSubnetOTP] = useState<string>("");
  const [subnetAccessToken, setSubnetAccessToken] = useState<string>("");
  const [selectedSubnetOrganization, setSelectedSubnetOrganization] =
    useState<string>("");
  const [subnetRegToken, setSubnetRegToken] = useState<string>("");
  const [subnetOrganizations, setSubnetOrganizations] = useState<
    SubnetOrganization[]
  >([]);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLicenseInfo, setLoadingLicenseInfo] = useState<boolean>(false);
  const [clusterRegistered, setClusterRegistered] = useState<boolean>(false);
  const [licenseInfo, setLicenseInfo] = useState<SubnetInfo | undefined>();
  const [curTab, setCurTab] = useState<number>(0);

  const [initialLicenseLoading, setInitialLicenseLoading] =
    useState<boolean>(true);
  const clearForm = () => {
    setSubnetAccessToken("");
    setSelectedSubnetOrganization("");
    setSubnetRegToken("");
    setShowPassword(false);
    setSubnetOrganizations([]);
    setLicense("");
    setSubnetPassword("");
    setSubnetEmail("");
    setSubnetMFAToken("");
    setSubnetOTP("");
  };

  const getSubnetInfo = hasPermission(
    CONSOLE_UI_RESOURCE,
    IAM_PAGES_PERMISSIONS[IAM_PAGES.LICENSE],
    true
  );

  const fetchLicenseInfo = useCallback(() => {
    if (loadingLicenseInfo) {
      return;
    }
    if (getSubnetInfo) {
      setLoadingLicenseInfo(true);
      api
        .invoke("GET", `/api/v1/subnet/info`)
        .then((res: SubnetInfo) => {
          setLicenseInfo(res);
          setClusterRegistered(true);
          setLoadingLicenseInfo(false);
        })
        .catch((err: ErrorResponseHandler) => {
          if (
            err.detailedError.toLowerCase() !==
            "License is not present".toLowerCase()
          ) {
            dispatch(setErrorSnackMessage(err));
          }
          setClusterRegistered(false);
          setLoadingLicenseInfo(false);
        });
    } else {
      setLoadingLicenseInfo(false);
    }
  }, [loadingLicenseInfo, getSubnetInfo, dispatch]);

  const fetchSubnetRegToken = () => {
    if (loading || subnetRegToken) {
      return;
    }
    setLoading(true);
    api
      .invoke("GET", "/api/v1/subnet/registration-token")
      .then((resp: SubnetRegTokenResponse) => {
        setLoading(false);
        if (resp && resp.regToken) {
          setSubnetRegToken(resp.regToken);
        }
      })
      .catch((err: ErrorResponseHandler) => {
        console.error(err);
        dispatch(setErrorSnackMessage(err));
        setLoading(false);
      });
  };

  const callRegister = (token: string, account_id: string) => {
    const request: SubnetRegisterRequest = {
      token: token,
      account_id: account_id,
    };
    api
      .invoke("POST", "/api/v1/subnet/register", request)
      .then(() => {
        setLoading(false);
        clearForm();
        fetchLicenseInfo();
      })
      .catch((err: ErrorResponseHandler) => {
        dispatch(setErrorSnackMessage(err));
        setLoading(false);
      });
  };
  const subnetRegister = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    if (subnetAccessToken && selectedSubnetOrganization) {
      callRegister(subnetAccessToken, selectedSubnetOrganization);
    }
  };

  const subnetLoginWithMFA = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    const request: SubnetLoginWithMFARequest = {
      username: subnetEmail,
      otp: subnetOTP,
      mfa_token: subnetMFAToken,
    };
    api
      .invoke("POST", "/api/v1/subnet/login/mfa", request)
      .then((resp: SubnetLoginResponse) => {
        setLoading(false);
        if (resp && resp.access_token && resp.organizations.length > 0) {
          if (resp.organizations.length === 1) {
            callRegister(
              resp.access_token,
              resp.organizations[0].accountId.toString()
            );
          } else {
            setSubnetAccessToken(resp.access_token);
            setSubnetOrganizations(resp.organizations);
            setSelectedSubnetOrganization(
              resp.organizations[0].accountId.toString()
            );
          }
        }
      })
      .catch((err: ErrorResponseHandler) => {
        dispatch(setErrorSnackMessage(err));
        setLoading(false);
        setSubnetOTP("");
      });
  };

  const subnetLogin = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    let request: SubnetLoginRequest = {
      username: subnetEmail,
      password: subnetPassword,
      apiKey: license,
    };
    api
      .invoke("POST", "/api/v1/subnet/login", request)
      .then((resp: SubnetLoginResponse) => {
        setLoading(false);
        if (resp && resp.registered) {
          clearForm();
          fetchLicenseInfo();
        } else if (resp && resp.mfa_token) {
          setSubnetMFAToken(resp.mfa_token);
        } else if (resp && resp.access_token && resp.organizations.length > 0) {
          setSubnetAccessToken(resp.access_token);
          setSubnetOrganizations(resp.organizations);
          setSelectedSubnetOrganization(
            resp.organizations[0].accountId.toString()
          );
        }
      })
      .catch((err: ErrorResponseHandler) => {
        dispatch(setErrorSnackMessage(err));
        setLoading(false);
        clearForm();
      });
  };

  useEffect(() => {
    if (initialLicenseLoading) {
      fetchLicenseInfo();
      setInitialLicenseLoading(false);
    }
  }, [fetchLicenseInfo, initialLicenseLoading, setInitialLicenseLoading]);

  let clusterRegistrationForm: JSX.Element = <Fragment />;

  if (subnetAccessToken && subnetOrganizations.length > 0) {
    clusterRegistrationForm = (
      <Box
        sx={{
          display: "flex",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexFlow: "column",
            flex: "2",
          }}
        >
          <Box
            sx={{
              marginTop: "15px",
              marginBottom: "15px",
              "& .title-text": {
                marginLeft: "0px",
              },
            }}
          >
            <FormTitle title={`Register MinIO cluster`} />
          </Box>
          <Box>
            <SelectWrapper
              id="subnet-organization"
              name="subnet-organization"
              onChange={(e) =>
                setSelectedSubnetOrganization(e.target.value as string)
              }
              label="Select an organization"
              value={selectedSubnetOrganization}
              options={subnetOrganizations.map((organization) => ({
                label: organization.company,
                value: organization.accountId.toString(),
              }))}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                marginTop: "15px",
              }}
            >
              <Button
                id={"register-cluster"}
                onClick={() => subnetRegister()}
                disabled={loading || subnetAccessToken.trim().length === 0}
                variant="callAction"
                label={"Register"}
              />
            </Box>
          </Box>
        </Box>
        <RegisterHelpBox />
      </Box>
    );
  } else if (subnetMFAToken) {
    clusterRegistrationForm = (
      <Box
        sx={{
          display: "flex",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexFlow: "column",
            flex: "2",
          }}
        >
          <Box
            sx={{
              fontSize: "16px",
              display: "flex",
              flexFlow: "column",
              marginTop: "30px",
              marginBottom: "30px",
            }}
          >
            Two-Factor Authentication
          </Box>

          <Box>
            Please enter the 6-digit verification code that was sent to your
            email address. This code will be valid for 5 minutes.
          </Box>

          <Box
            sx={{
              flex: "1",
              marginTop: "30px",
            }}
          >
            <InputBoxWrapper
              overlayIcon={<LockOutlinedIcon />}
              id="subnet-otp"
              name="subnet-otp"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setSubnetOTP(event.target.value)
              }
              placeholder=""
              label=""
              value={subnetOTP}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Button
              id={"verify"}
              onClick={() => subnetLoginWithMFA()}
              disabled={
                loading ||
                subnetOTP.trim().length === 0 ||
                subnetMFAToken.trim().length === 0
              }
              variant="callAction"
              label={"Verify"}
            />
          </Box>
        </Box>

        <RegisterHelpBox />
      </Box>
    );
  } else {
    clusterRegistrationForm = (
      <Fragment>
        <Box
          sx={{
            "& .title-text": {
              marginLeft: "27px",
              fontWeight: 600,
            },
          }}
        >
          <FormTitle
            icon={<OnlineRegistrationIcon />}
            title={`Online activation of MinIO Subscription Network License`}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexFlow: {
              xs: "column",
              md: "row",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexFlow: "column",
              flex: "2",
            }}
          >
            <Box
              sx={{
                fontSize: "16px",
                display: "flex",
                flexFlow: "column",
                marginTop: "30px",
                marginBottom: "30px",
              }}
            >
              Use your MinIO Subscription Network login credentials to register
              this cluster.
            </Box>
            <Box
              sx={{
                flex: "1",
              }}
            >
              <InputBoxWrapper
                className={classes.spacerBottom}
                classes={{
                  inputLabel: classes.sizedLabel,
                }}
                id="subnet-email"
                name="subnet-email"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setSubnetEmail(event.target.value)
                }
                label="Email"
                value={subnetEmail}
                overlayIcon={<UsersIcon />}
              />
              <InputBoxWrapper
                className={classes.spacerBottom}
                classes={{
                  inputLabel: classes.sizedLabel,
                }}
                id="subnet-password"
                name="subnet-password"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setSubnetPassword(event.target.value)
                }
                label="Password"
                type={showPassword ? "text" : "password"}
                value={subnetPassword}
                overlayIcon={
                  showPassword ? <VisibilityOffIcon /> : <RemoveRedEyeIcon />
                }
                overlayAction={() => setShowPassword(!showPassword)}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  "& button": {
                    marginLeft: "8px",
                  },
                }}
              >
                <Button
                  id={"sign-up"}
                  type="submit"
                  className={classes.spacerRight}
                  variant="regular"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(
                      `https://min.io/signup?ref=${
                        operatorMode ? "op" : "con"
                      }`,
                      "_blank"
                    );
                  }}
                  label={"Sign up"}
                />
                <Button
                  id={"register-credentials"}
                  type="submit"
                  variant="callAction"
                  disabled={
                    loading ||
                    subnetEmail.trim().length === 0 ||
                    subnetPassword.trim().length === 0
                  }
                  onClick={() => subnetLogin()}
                  label={"Register"}
                />
              </Box>
            </Box>
          </Box>
          <RegisterHelpBox />
        </Box>
      </Fragment>
    );
  }

  const apiKeyRegistration = (
    <Fragment>
      <Box
        sx={{
          border: "1px solid #eaeaea",
          borderRadius: "2px",
          display: "flex",
          flexFlow: "column",
          padding: "43px",
        }}
      >
        {clusterRegistered && licenseInfo ? (
          <ClusterRegistered
            email={licenseInfo.email}
            linkClass={classes.link}
          />
        ) : (
          <ApiKeyRegister
            afterRegister={fetchLicenseInfo}
            registerEndpoint={"/api/v1/subnet/login"}
          />
        )}
      </Box>
      <ProxyConfiguration linkClass={classes.link} />
    </Fragment>
  );

  const offlineRegUrl = `https://subnet.min.io/cluster/register?token=${subnetRegToken}`;
  const offlineRegistration = (
    <Fragment>
      <Box
        sx={{
          border: "1px solid #eaeaea",
          borderRadius: "2px",
          display: "flex",
          flexFlow: "column",
          padding: "43px",
        }}
      >
        {clusterRegistered && licenseInfo ? (
          <ClusterRegistered
            email={licenseInfo.email}
            linkClass={classes.link}
          />
        ) : null}
        <Box
          sx={{
            "& .title-text": {
              marginLeft: "27px",
              fontWeight: 600,
            },
          }}
        >
          <FormTitle
            icon={<OfflineRegistrationIcon />}
            title={`Register cluster in an Airgap environment`}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexFlow: "column",
              flex: "2",
              marginTop: "15px",
              "& .step-number": {
                color: "#ffffff",
                height: "25px",
                width: "25px",
                background: "#081C42",
                marginRight: "10px",
                textAlign: "center",
                fontWeight: 600,
                borderRadius: "50%",
              },

              "& .step-row": {
                fontSize: "16px",
                display: "flex",
                marginTop: "15px",
                marginBottom: "15px",
              },
            }}
          >
            <Box>
              <Box className="step-row">
                <div className="step-text">
                  Click on the link to register this cluster in SUBNET
                </div>
              </Box>

              <Box
                sx={{
                  flex: "1",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Link
                  className={classes.link}
                  color="inherit"
                  href={offlineRegUrl}
                  target="_blank"
                >
                  https://subnet.min.io/cluster/register
                </Link>

                <TooltipWrapper tooltip={"Copy to Clipboard"}>
                  <CopyToClipboard text={offlineRegUrl}>
                    <Button
                      type={"button"}
                      id={"copy-ult-to-clip-board"}
                      icon={<CopyIcon />}
                      color={"primary"}
                      variant={"regular"}
                    />
                  </CopyToClipboard>
                </TooltipWrapper>
              </Box>

              <div
                style={{
                  marginTop: "25px",
                  fontSize: "14px",
                  fontStyle: "italic",
                  color: "#5E5E5E",
                }}
              >
                If this machine does not have internet connection, Copy paste
                the following URL in a browser where you access SUBNET and
                follow the instructions to complete the registration
              </div>
            </Box>
          </Box>
          <RegisterHelpBox />
        </Box>
      </Box>
    </Fragment>
  );

  const regUi = (
    <Fragment>
      <Box
        sx={{
          border: "1px solid #eaeaea",
          borderRadius: "2px",
          display: "flex",
          flexFlow: "column",
          padding: "43px",
        }}
      >
        {clusterRegistered && licenseInfo ? (
          <ClusterRegistered
            email={licenseInfo.email}
            linkClass={classes.link}
          />
        ) : (
          clusterRegistrationForm
        )}
      </Box>

      {!clusterRegistered && <ProxyConfiguration linkClass={classes.link} />}
    </Fragment>
  );

  const loadingUi = <div>Loading..</div>;
  const uiToShow = loadingLicenseInfo ? loadingUi : regUi;

  return (
    <Fragment>
      <PageHeader
        label="Register to MinIO Subscription Network"
        actions={<React.Fragment />}
      />

      <PageLayout>
        <Tabs
          value={curTab}
          onChange={(e: React.ChangeEvent<{}>, newValue: number) => {
            setCurTab(newValue);
          }}
          indicatorColor="primary"
          textColor="primary"
          aria-label="cluster-tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="Credentials"
            id="simple-tab-0"
            aria-controls="simple-tabpanel-0"
          />
          <Tab
            label="API Key"
            id="simple-tab-1"
            aria-controls="simple-tabpanel-1"
          />
          <Tab
            label="Airgap"
            id="simple-tab-2"
            aria-controls="simple-tabpanel-2"
            onClick={() => fetchSubnetRegToken()}
          />
        </Tabs>

        <TabPanel index={0} value={curTab}>
          {uiToShow}
        </TabPanel>
        <TabPanel index={1} value={curTab}>
          {apiKeyRegistration}
        </TabPanel>
        <TabPanel index={2} value={curTab}>
          {offlineRegistration}
        </TabPanel>
      </PageLayout>
    </Fragment>
  );
};

export default withStyles(styles)(Register);
